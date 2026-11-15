import uuid
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.core import supabase
from backend.main import app
from backend.services import admins
from backend.tests.conftest import add_admin

client = TestClient(app)
ZIP = Path(__file__).parent.parent / "test_files" / "Pelectro 2V1 Panel_Legend_Top.zip"
QUOTE = {
    "boardW": 130, "boardL": 80, "quantity": 275,
    "layers": "2", "orderType": "Bare PCB", "thickness": "1.6", "copper": "1",
    "material": "FR4 TG130", "maskColor": "Green", "silkscreen": "White",
    "finish": "HASL-LF", "traceSpace": "6/6", "minHole": "0.30", "ipcStd": "IPC-2",
    "testing": "FlyingProbe", "express": "Standard",
    "specials": {k: False for k in ("impedance", "blindVias", "goldFingers", "halfHole", "resinPlug", "metalEdge", "halogenFree")},
}
SID = str(uuid.uuid4())


@pytest.fixture
def storage(monkeypatch):
    saved = []
    monkeypatch.setattr(supabase, "ensure_bucket", lambda b: None)
    monkeypatch.setattr(supabase, "upload_file", lambda b, p, d, ct: saved.append((b, p, d)))
    return saved


def parse(path=ZIP, headers=None):
    with path.open("rb") as f:
        return client.post("/api/gerber/parse", files={"file": (path.name, f, "application/zip")}, headers=headers)


def test_health():
    assert client.get("/api/health").json() == {"ok": True, "pricing": "defaults"}


def test_public_quote_hides_internals():
    r = client.post("/api/quote", json=QUOTE)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "costPerBoard" not in body and "lines" not in body and body["pricePerBoard"] > 0


def test_quote_bad_option():
    assert client.post("/api/quote", json={**QUOTE, "finish": "Gold"}).status_code == 422


def test_quote_works_without_records_tables():
    assert client.post("/api/quote", json=QUOTE, headers={"X-Session-Id": SID}).status_code == 200


def test_quote_captures_session_and_never_lowers_stage(db):
    h = {"X-Session-Id": SID}
    client.post("/api/quote", json=QUOTE, headers=h)
    (s,) = db.tables["quote_sessions"]
    assert s["id"] == SID and s["stage"] == "quoted" and s["quote_count"] == 1 and s["board_w"] == 130
    s["stage"] = "checkout_started"
    client.post("/api/quote", json={**QUOTE, "quantity": 10}, headers=h)
    assert s["stage"] == "checkout_started" and s["quote_count"] == 2 and s["quantity"] == 10


def test_quote_ignores_bad_session_header(db):
    client.post("/api/quote", json=QUOTE, headers={"X-Session-Id": "nope"})
    assert not db.tables["quote_sessions"]


def test_parse_stores_zip_once(db, storage):
    r = parse(headers={"X-Session-Id": SID})
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] and body["dimensions"]["width_mm"] > 0
    (bucket, path, data), = storage
    assert path == f"uploads/{body['uploadId']}.zip" and data == ZIP.read_bytes()
    (u,) = db.tables["uploads"]
    assert u["id"] == body["uploadId"] and u["parse_ok"] and u["session_id"] == SID
    assert db.tables["quote_sessions"][0]["upload_id"] == body["uploadId"]


def test_parse_storage_down_is_not_ok():
    body = parse().json()
    assert body["uploadId"] is None and not body["ok"] and body["errors"]


def test_parse_rejects_rar_and_unsafe_zip(tmp_path):
    assert client.post("/api/gerber/parse", files={"file": ("board.rar", b"x", "application/octet-stream")}).status_code == 400
    bad = tmp_path / "bad.zip"
    with zipfile.ZipFile(bad, "w") as z:
        z.writestr("../evil.gbr", "x")
    r = parse(bad)
    assert r.status_code == 400 and "unsafe" in r.json()["detail"]
    assert client.post("/api/gerber/parse", files={"file": ("x.zip", b"PK\x03\x04junk", "application/zip")}).status_code == 400


def test_checkout_saves_contact(db):
    r = client.post("/api/checkout", json={"kind": "manual", "contact": {"email": " A@B.co ", "phone": "+91 98765 43210"},
                                           "note": "call me", "quote": QUOTE}, headers={"X-Session-Id": SID})
    assert r.status_code == 204
    (s,) = db.tables["quote_sessions"]
    assert (s["stage"], s["email"], s["phone"], s["note"], s["layers"]) == ("manual_requested", "a@b.co", "9876543210", "call me", "2")


def test_checkout_needs_session_and_valid_contact(db):
    assert client.post("/api/checkout", json={"kind": "checkout"}).status_code == 400
    r = client.post("/api/checkout", json={"kind": "checkout", "contact": {"email": "nope"}}, headers={"X-Session-Id": SID})
    assert r.status_code == 422


def test_rate_limit_on_parse():
    codes = [client.post("/api/gerber/parse", files={"file": ("b.rar", b"x")}).status_code for _ in range(11)]
    assert codes[:10] == [400] * 10 and codes[10] == 429


def test_admin_requires_token():
    assert client.get("/api/admin/orders").status_code == 401


@pytest.fixture
def team(db):
    add_admin("b@x.com", approved=False)
    return add_admin("a@x.com", role="owner")[1]


def test_list_users(team):
    users = client.get("/api/admin/users", headers=team).json()["users"]
    assert {(u["email"], u["status"], u["isYou"]) for u in users} == {("a@x.com", "approved", True), ("b@x.com", "pending", False)}
    assert all("password_hash" not in u for u in users)


def test_approve_user_with_role(team, db):
    b = admins.get_by_email("b@x.com")["id"]
    r = client.post(f"/api/admin/users/{b}/approve", json={"role": "manager"}, headers=team)
    assert r.status_code == 200 and r.json()["status"] == "approved" and r.json()["role"] == "manager"
    assert client.post("/api/admin/users/nope/approve", headers=team).status_code == 404
    assert db.tables["activity_log"][-1]["action"] == "team_approve"


def test_delete_user(team, db):
    me, b = admins.get_by_email("a@x.com")["id"], admins.get_by_email("b@x.com")["id"]
    r = client.delete(f"/api/admin/users/{me}", headers=team)
    assert r.status_code == 403 and r.json()["detail"] == "You cannot remove yourself"
    assert client.delete(f"/api/admin/users/{b}", headers=team).status_code == 204
    assert [r["email"] for r in db.tables["admin_users"]] == ["a@x.com"]


def test_last_owner_cannot_be_demoted(team):
    me = admins.get_by_email("a@x.com")["id"]
    assert client.patch(f"/api/admin/users/{me}", json={"role": "manager"}, headers=team).status_code == 409


def test_roles_enforced(db):
    _, staff = add_admin("s@x.com", role="staff")
    _, manager = add_admin("m@x.com", role="manager")
    assert client.get("/api/admin/users", headers=staff).status_code == 403
    assert client.get("/api/admin/users", headers=manager).status_code == 403
    assert client.get("/api/admin/activity", headers=staff).status_code == 403
    assert client.get("/api/admin/activity", headers=manager).status_code == 200
    assert client.get("/api/admin/orders", headers=staff).status_code == 200
    assert client.get("/api/admin/pricing", headers=staff).status_code == 403
    assert client.get("/api/admin/store", headers=staff).status_code == 200


def test_before_migration_everyone_is_owner(db):
    db.no_role = True
    db.missing.update({"orders", "quote_sessions", "uploads", "activity_log", "customers"})
    row, h = add_admin("old@x.com", role="staff")
    assert "role" not in db.tables["admin_users"][0]
    assert client.get("/api/auth/me", headers=h).json()["role"] == "owner"
    assert client.get("/api/admin/users", headers=h).status_code == 200
    for path in ("orders", "sessions", "customers", "files", "activity"):
        assert client.get(f"/api/admin/{path}", headers=h).json() == {"items": [], "total": 0, "ready": False}
    assert client.get("/api/admin/summary", headers=h).json()["ready"] is False
    assert client.patch(f"/api/admin/users/{row['id']}", json={"role": "owner"}, headers=h).status_code == 503
    store = client.get("/api/admin/store", headers=h).json()
    assert store["recordsReady"] is False and store["pricingReady"] is False


def test_pending_user_blocked(db):
    assert client.get("/api/admin/users", headers=add_admin("p@x.com", approved=False)[1]).status_code == 401


def test_supabase_down_is_502(team, monkeypatch):
    def boom():
        raise admins.supabase.SupabaseError("down")
    monkeypatch.setattr(admins, "list_users", boom)
    assert client.get("/api/admin/users", headers=team).status_code == 502


@pytest.fixture
def bucket(monkeypatch):
    """Storage the browser uploads to directly: {path: bytes}, with the removed paths in `gone`."""
    files, gone = {}, []

    def download(b, path):
        if path not in files:
            raise supabase.SupabaseError("Object not found")
        return files[path]

    monkeypatch.setattr(supabase, "ensure_bucket", lambda b: None)
    monkeypatch.setattr(supabase, "signed_upload_url", lambda b, path: f"https://storage.test/{path}?token=t")
    monkeypatch.setattr(supabase, "download_file", download)
    monkeypatch.setattr(supabase, "delete_file", lambda b, path: gone.append(path))
    return files, gone


def ask_link(name="board.zip", size=1000):
    return client.post("/api/gerber/upload-url", json={"filename": name, "size": size})


def test_direct_upload_gives_a_link_then_parses_from_storage(db, bucket):
    files, gone = bucket
    link = ask_link().json()
    assert link["url"] == f"https://storage.test/uploads/{link['uploadId']}.zip?token=t"
    files[f"uploads/{link['uploadId']}.zip"] = ZIP.read_bytes()  # what the browser PUT to the link
    r = client.post("/api/gerber/parse-upload", json={"uploadId": link["uploadId"], "filename": ZIP.name},
                    headers={"X-Session-Id": SID})
    body = r.json()
    assert r.status_code == 200 and body["ok"] and body["uploadId"] == link["uploadId"]
    (u,) = db.tables["uploads"]
    assert u["id"] == link["uploadId"] and u["parse_ok"] and u["size_bytes"] == ZIP.stat().st_size and not gone
    assert db.tables["quote_sessions"][0]["upload_id"] == link["uploadId"]


def test_direct_upload_refuses_wrong_type_and_size(bucket):
    assert ask_link("board.rar").status_code == 400
    assert ask_link(size=51 * 1024 * 1024).status_code == 413


def test_direct_upload_link_fails_cleanly_when_storage_is_down():
    assert ask_link().status_code == 503


def test_parse_upload_unknown_or_bad_file(bucket):
    files, gone = bucket
    missing = str(uuid.uuid4())
    assert client.post("/api/gerber/parse-upload", json={"uploadId": missing, "filename": "a.zip"}).status_code == 404
    assert client.post("/api/gerber/parse-upload", json={"uploadId": "not-an-id", "filename": "a.zip"}).status_code == 422
    files[f"uploads/{missing}.zip"] = b"PK\x03\x04junk"
    r = client.post("/api/gerber/parse-upload", json={"uploadId": missing, "filename": "a.zip"})
    assert r.status_code == 400 and gone == [f"uploads/{missing}.zip"]


def test_options_tell_the_form_how_to_upload():
    o = client.get("/api/pricing/options").json()
    assert o["maxUploadMb"] == 50 and o["directUpload"] is True

