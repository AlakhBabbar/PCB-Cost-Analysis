import uuid

import pytest
from fastapi.testclient import TestClient

from backend.core import woocommerce
from backend.core.settings import settings
from backend.main import app
from backend.tests.test_api import QUOTE, SID

client = TestClient(app)
CUSTOMER = {
    "firstName": "Test", "lastName": "Buyer", "email": " Buyer@Example.com ", "phone": "+91 98765 43210",
    "company": "Acme Boards", "gstin": "09aaacb1234f1z5",
    "address1": "12 MG Road", "city": "Agra", "state": "up", "postcode": "282005", "note": "Leave at gate",
}
UPLOAD = str(uuid.uuid4())
PAY_URL = "https://shop.test/checkout/order-pay/6412/?pay_for_order=true&key=wc_order_k"


@pytest.fixture
def shop(monkeypatch, db):
    """WooCommerce enabled and faked, one parsed upload on record. Returns what was sent."""
    for k, v in {"wc_url": "https://shop.test", "wc_key": "ck_x", "wc_secret": "cs_x", "wc_product_id": 6309}.items():
        monkeypatch.setattr(settings, k, v)
    db.tables["uploads"].append({"id": UPLOAD, "filename": "my board.zip", "storage_path": f"uploads/{UPLOAD}.zip",
                                 "width_mm": 80.4, "height_mm": 129.6, "copper_layers": 2, "min_drill_mm": 0.3,
                                 "parse_ok": True, "order_id": None})
    sent = {"orders": [], "notes": []}

    def create(order):
        sent["orders"].append(order)
        return {"id": 6412, "status": "pending", "payment_url": PAY_URL}

    monkeypatch.setattr(woocommerce, "create_order", create)
    monkeypatch.setattr(woocommerce, "add_order_note", lambda i, n: sent["notes"].append((i, n)))
    sent["db"] = db
    return sent


def post(quote=QUOTE, customer=CUSTOMER, upload=UPLOAD):
    return client.post("/api/order", json={"uploadId": upload, "quote": quote, "customer": customer},
                       headers={"X-Session-Id": SID})


def test_order_creates_pending_woo_order(shop):
    r = post()
    assert r.status_code == 200, r.text
    assert r.json() == {"orderId": 6412, "paymentUrl": PAY_URL}

    quote = client.post("/api/quote", json=QUOTE).json()
    (order,) = shop["orders"]
    assert order["status"] == "pending" and order["set_paid"] is False
    (item,) = order["line_items"]
    assert item["product_id"] == 6309 and item["quantity"] == QUOTE["quantity"]
    assert item["total"] == item["subtotal"] == f"{quote['subtotal']:.2f}"
    meta = {m["key"]: m["value"] for m in item["meta_data"]}
    assert all(meta[k] == v for k, v in quote["summary"].items())
    assert {"Order type", "Material", "Silkscreen"} <= meta.keys() and meta["Gerber file"] == "my board.zip"
    assert {"key": "GSTIN", "value": "09AAACB1234F1Z5"} in order["meta_data"]

    b = order["billing"]
    assert (b["email"], b["phone"], b["state"], b["country"], b["company"]) == ("buyer@example.com", "9876543210", "UP", "IN", "Acme Boards")
    assert order["shipping"]["postcode"] == "282005" and "email" not in order["shipping"]
    (note_id, note), = shop["notes"]
    assert note_id == 6412 and "http" not in note and "admin panel" in note

    db = shop["db"]
    (row,) = db.tables["orders"]
    assert row["woo_order_id"] == 6412 and row["needs_review"] is False and row["gstin"] == "09AAACB1234F1Z5"
    assert row["cost_per_board"] > 0 and row["upload_id"] == UPLOAD
    assert db.tables["uploads"][0]["order_id"] == row["id"]
    assert db.tables["quote_sessions"][0]["stage"] == "ordered"
    assert db.tables["activity_log"][0]["action"] == "order_created"


def test_mismatch_flags_review_instead_of_rejecting(shop):
    assert post(quote={**QUOTE, "boardW": 100, "layers": "4", "minHole": "0.40"}).status_code == 200
    row = shop["db"].tables["orders"][0]
    assert row["needs_review"] and len(row["review_reasons"]) == 3


def test_unusable_file_cannot_be_ordered(shop):
    shop["db"].tables["uploads"][0]["parse_ok"] = False
    assert post().status_code == 422 and not shop["orders"]


def test_manual_quote_cannot_be_ordered(shop):
    r = post(quote={**QUOTE, "material": "High-Freq"})
    assert r.status_code == 422 and not shop["orders"]


def test_order_works_before_migration(shop):
    shop["db"].missing.update({"orders", "uploads", "quote_sessions", "activity_log"})
    assert post().status_code == 200
    assert shop["orders"][0]["line_items"][0]["meta_data"][-1] == {"key": "Gerber file", "value": "Gerber file"}


def test_price_comes_from_server_not_client(shop):
    post(quote={**QUOTE, "pricePerBoard": 0.01, "total": 1})
    assert float(shop["orders"][0]["line_items"][0]["total"]) > 100


@pytest.mark.parametrize("field,value", [("email", "nope"), ("phone", "123"), ("postcode", "28200"),
                                         ("firstName", ""), ("gstin", "12345")])
def test_bad_customer_is_422(shop, field, value):
    r = post(customer={**CUSTOMER, field: value})
    assert r.status_code == 422 and r.json()["detail"][0]["loc"][-1] == field
    assert not shop["orders"]


def test_bad_upload_id_is_422(shop):
    assert post(upload="nope").status_code == 422


def test_disabled_without_woo_settings(shop, monkeypatch):
    monkeypatch.setattr(settings, "wc_key", "")
    assert post().status_code == 503 and not shop["orders"]


def test_store_error_is_502(shop, monkeypatch):
    def fail(order):
        raise woocommerce.WooError("Store returned 401: bad key")
    monkeypatch.setattr(woocommerce, "create_order", fail)
    r = post()
    assert r.status_code == 502 and "bad key" in r.json()["detail"]


def test_note_failure_still_returns_payment_link(shop, monkeypatch):
    def fail(i, n):
        raise woocommerce.WooError("note failed")
    monkeypatch.setattr(woocommerce, "add_order_note", fail)
    assert post().status_code == 200


def test_order_rate_limit(shop):
    codes = [post().status_code for _ in range(6)]
    assert codes[:5] == [200] * 5 and codes[5] == 429
