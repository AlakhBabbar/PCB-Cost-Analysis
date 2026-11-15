import base64
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.core import supabase, woocommerce
from backend.core.settings import settings
from backend.main import app
from backend.tests.conftest import add_admin

client = TestClient(app)
SECRET = "whsec_test"


def ago(minutes: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()


@pytest.fixture
def staff(db):
    return add_admin("s@x.com", role="staff")[1]


@pytest.fixture
def order(db):
    row = {"id": str(uuid.uuid4()), "created_at": ago(1), "woo_order_id": 6412, "woo_status": "pending",
           "payment_status": "pending", "stage": "new", "needs_review": True, "review_reasons": ["size"],
           "first_name": "Test", "last_name": "Buyer", "email": "buyer@example.com", "company": "Acme",
           "quantity": 10, "price_per_board": 100.0, "cost_per_board": 80.0, "total": 1180.0, "upload_id": None}
    db.tables["orders"].append(row)
    return row


def signed(body: bytes) -> dict:
    sig = base64.b64encode(hmac.new(SECRET.encode(), body, hashlib.sha256).digest()).decode()
    return {"X-WC-Webhook-Signature": sig, "Content-Type": "application/json"}


@pytest.fixture
def secret(monkeypatch):
    monkeypatch.setattr(settings, "wc_webhook_secret", SECRET)


def test_webhook_marks_paid_and_logs(order, secret, db):
    body = json.dumps({"id": 6412, "status": "processing"}).encode()
    r = client.post("/api/woo/webhook", content=body, headers=signed(body))
    assert r.json() == {"ok": True, "handled": True}
    assert (order["payment_status"], order["woo_status"]) == ("paid", "processing")
    (log,) = db.tables["activity_log"]
    assert log["target_id"] == order["id"] and log["admin_id"] is None and log["detail"]["to"] == "paid"


@pytest.mark.parametrize("woo,pay", [("completed", "paid"), ("on-hold", "pending"), ("refunded", "refunded"),
                                     ("cancelled", "cancelled"), ("failed", "failed")])
def test_status_map(order, secret, woo, pay):
    body = json.dumps({"id": 6412, "status": woo}).encode()
    client.post("/api/woo/webhook", content=body, headers=signed(body))
    assert order["payment_status"] == pay


def test_webhook_rejects_bad_signature(order, secret):
    body = json.dumps({"id": 6412, "status": "processing"}).encode()
    r = client.post("/api/woo/webhook", content=body, headers={"X-WC-Webhook-Signature": "nope"})
    assert r.status_code == 401 and order["payment_status"] == "pending"


def test_webhook_ping_and_unknown_order(db, secret):
    ping = client.post("/api/woo/webhook", content=b"webhook_id=7",
                       headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert ping.status_code == 200
    body = json.dumps({"id": 999, "status": "processing"}).encode()
    assert client.post("/api/woo/webhook", content=body, headers=signed(body)).json() == {"ok": True, "handled": False}


def test_sync_pulls_status(order, staff, db, monkeypatch):
    monkeypatch.setattr(woocommerce, "get_order", lambda i: {"id": i, "status": "completed"})
    r = client.post(f"/api/admin/orders/{order['id']}/sync", headers=staff)
    assert r.status_code == 200 and r.json()["paymentStatus"] == "paid"
    assert db.tables["activity_log"][0]["action"] == "woo_sync"


def test_orders_list_and_detail(order, staff):
    page = client.get("/api/admin/orders?q=acme&status=review", headers=staff).json()
    assert page["total"] == 1 and page["ready"] and page["items"][0]["wooOrderId"] == 6412
    assert client.get("/api/admin/orders?q=nobody", headers=staff).json()["total"] == 0
    d = client.get(f"/api/admin/orders/{order['id']}", headers=staff).json()
    assert d["customer"]["firstName"] == "Test" and d["money"]["total"] == 1180.0
    assert d["margin"] == {"costPerBoard": 80.0, "perBoard": 20.0, "total": 200.0, "marginPct": 20.0}
    assert client.get(f"/api/admin/orders/{uuid.uuid4()}", headers=staff).status_code == 404


def test_patch_order_logs_stage_and_note(order, staff, db):
    r = client.patch(f"/api/admin/orders/{order['id']}", json={"stage": "in_production", "adminNote": "rush"}, headers=staff)
    assert r.status_code == 200 and r.json()["stage"] == "in_production"
    assert [a["action"] for a in db.tables["activity_log"]] == ["order_stage", "order_note"]
    assert [a["action"] for a in r.json()["timeline"]] and r.json()["adminNote"] == "rush"
    assert client.patch(f"/api/admin/orders/{order['id']}", json={"stage": "lost"}, headers=staff).status_code == 422


def test_sessions_views_and_handled(db, staff):
    s = lambda stage, mins, **kw: {"id": str(uuid.uuid4()), "stage": stage, "created_at": ago(mins), "updated_at": ago(mins),
                                   "order_id": None, "handled": False, **kw}
    db.tables["quote_sessions"] += [s("checkout_started", 30, email="late@x.com"), s("checkout_started", 2),
                                    s("manual_requested", 5), s("quoted", 1)]
    abandoned = client.get("/api/admin/sessions?view=abandoned", headers=staff).json()
    assert abandoned["total"] == 1 and abandoned["items"][0]["email"] == "late@x.com"
    assert client.get("/api/admin/sessions?view=manual", headers=staff).json()["total"] == 1
    assert client.get("/api/admin/sessions?view=browsing", headers=staff).json()["total"] == 1
    sid = abandoned["items"][0]["id"]
    r = client.patch(f"/api/admin/sessions/{sid}", json={"handled": True}, headers=staff)
    assert r.status_code == 200 and r.json()["handled"] is True
    assert db.tables["activity_log"][0]["action"] == "session_handled"


def test_files_link_is_short_and_logged(db, staff, monkeypatch):
    uid = str(uuid.uuid4())
    db.tables["uploads"].append({"id": uid, "created_at": ago(1), "filename": "b.zip", "storage_path": f"uploads/{uid}.zip"})
    seen = []
    monkeypatch.setattr(supabase, "signed_url", lambda b, p, e: seen.append(e) or f"https://files.test/{p}")
    assert client.get("/api/admin/files?q=b.zip", headers=staff).json()["total"] == 1
    r = client.get(f"/api/admin/files/{uid}/link", headers=staff)
    assert r.json() == {"url": f"https://files.test/uploads/{uid}.zip"} and seen == [300]
    assert db.tables["activity_log"][0]["action"] == "file_link"


def test_customers(db, staff):
    db.tables["customers"].append({"email": "a@x.com", "first_name": "A", "order_count": 2, "paid_total": 500,
                                   "last_order_at": ago(1), "created_at": ago(1)})
    assert client.get("/api/admin/customers?q=a@x", headers=staff).json()["items"][0]["orderCount"] == 2


def test_summary(order, db, staff):
    order["payment_status"] = "paid"
    db.tables["quote_sessions"].append({"id": "s1", "stage": "ordered", "created_at": ago(1), "updated_at": ago(1),
                                        "upload_id": "u", "order_id": order["id"], "handled": False})
    r = client.get("/api/admin/summary?days=7", headers=staff).json()
    assert r["ready"] and len(r["series"]) == 7
    assert r["today"]["orders"] == 1 and r["today"]["revenue"] == 1180.0 and r["today"]["quotes"] == 1
    assert r["funnel"] == {"quoted": 1, "uploaded": 1, "checkout": 1, "ordered": 1, "paid": 1}
    assert {a["kind"] for a in r["attention"]} == {"review", "paid"}


def test_store_status(db, staff, secret):
    s = client.get("/api/admin/store", headers=staff).json()
    assert s["webhookReady"] and s["recordsReady"] and s["wooEnabled"] == settings.woo_enabled
