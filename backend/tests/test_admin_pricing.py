import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.core import supabase
from backend.core.auth import require_admin
from backend.routers.admin_pricing import router
from backend.services.pricing import store
from backend.services.pricing.defaults import default_data
from backend.tests.test_pricing import REF

app = FastAPI()
app.include_router(router)
client = TestClient(app)
ME = {"id": "a1", "name": "Admin", "status": "approved", "role": "manager"}


@pytest.fixture(autouse=True)
def signed_in():
    app.dependency_overrides[require_admin] = lambda: dict(ME)
    yield
    app.dependency_overrides.clear()


def test_staff_cannot_touch_pricing():
    app.dependency_overrides[require_admin] = lambda: {**ME, "role": "staff"}
    assert client.get("/api/admin/pricing").status_code == 403


def test_get_pricing_offline_serves_defaults():
    body = client.get("/api/admin/pricing").json()
    assert body["ready"] is False and body["updatedAt"] is None
    assert body["config"] == client.get("/api/admin/pricing/defaults").json()["config"]


def test_check():
    assert client.post("/api/admin/pricing/check", json={"config": default_data()}).json() == {"ok": True, "errors": []}
    bad = default_data()
    bad["formulas"][0]["expr"] = "max(("
    body = client.post("/api/admin/pricing/check", json={"config": bad}).json()
    assert body["ok"] is False and body["errors"][0]["where"].startswith("Formulas")


def test_put_validates_then_saves(monkeypatch):
    saved = []
    monkeypatch.setattr(store, "save_config", lambda cfg, me, note: saved.append((me["id"], note)) or (cfg, "t", True))
    bad = default_data()
    bad["formulas"] = bad["formulas"][:-1]
    r = client.put("/api/admin/pricing", json={"config": bad})
    assert r.status_code == 422 and isinstance(r.json()["detail"], list) and not saved
    r = client.put("/api/admin/pricing", json={"config": default_data(), "note": "first"})
    assert r.status_code == 200 and r.json()["ready"] is True and saved == [("a1", "first")]


def test_put_without_migration_is_503(monkeypatch):
    def missing(*a, **kw):
        raise supabase.SupabaseError('{"code":"PGRST202"}')
    monkeypatch.setattr(supabase, "_send", missing)
    r = client.put("/api/admin/pricing", json={"config": default_data()})
    assert r.status_code == 503 and "002_pricing_v2.sql" in r.json()["detail"]


def test_versions_and_restore(monkeypatch):
    monkeypatch.setattr(store, "list_versions", lambda: [{"id": 3, "createdAt": "c", "adminName": "Admin", "note": ""}])
    monkeypatch.setattr(store, "get_version", lambda i: default_data() if i == 3 else None)
    monkeypatch.setattr(store, "save_config", lambda cfg, me, note: (cfg, note, True))
    assert client.get("/api/admin/pricing/versions").json()["items"][0]["id"] == 3
    assert client.post("/api/admin/pricing/versions/3/restore").json()["updatedAt"] == "Restored version 3"
    assert client.post("/api/admin/pricing/versions/4/restore").status_code == 404


def test_admin_quote_with_draft():
    saved = client.post("/api/admin/quote", json=REF).json()
    draft = default_data()
    next(s for s in draft["settings"] if s["key"] == "fixed_markup_pct")["value"] = 60
    tried = client.post("/api/admin/quote", json={**REF, "config": draft}).json()
    assert tried["pricePerBoard"] > saved["pricePerBoard"] > 0
    assert tried["lines"] and "profit" in tried


def test_admin_quote_errors():
    assert client.post("/api/admin/quote", json={**REF, "boardW": 5}).status_code == 422
    bad = default_data()
    bad["rules"][0]["when"] = "width <"
    r = client.post("/api/admin/quote", json={**REF, "config": bad})
    assert r.status_code == 422 and r.json()["detail"][0]["where"].startswith("Buyer options > Build rules")
