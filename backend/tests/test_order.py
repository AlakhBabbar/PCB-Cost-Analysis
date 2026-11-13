import json
import time

import pytest
from fastapi.testclient import TestClient

from backend.core import supabase, woocommerce
from backend.core.settings import settings
from backend.main import app
from backend.services.pricing import store
from backend.tests.test_api import QUOTE

client = TestClient(app)
CUSTOMER = {
    "firstName": "Asha", "lastName": "Rao", "email": " Asha@Example.com ", "phone": "+91 98765 43210",
    "address1": "12 MG Road", "city": "Agra", "state": "up", "postcode": "282005", "note": "Leave at gate",
}
ZIP = ("my board.zip", b"PK\x03\x04fake", "application/zip")


@pytest.fixture
def shop(monkeypatch, config):
    """Priced config, WooCommerce enabled, storage + store faked. Returns what was sent."""
    monkeypatch.setattr(store, "_cache", (time.monotonic(), config, "2026-01-01T00:00:00+00:00", {}))
    for k, v in {"wc_url": "https://shop.test", "wc_key": "ck_x", "wc_secret": "cs_x", "wc_product_id": 6309}.items():
        monkeypatch.setattr(settings, k, v)
    sent = {"uploads": [], "orders": [], "notes": []}
    monkeypatch.setattr(supabase, "ensure_bucket", lambda b: None)
    monkeypatch.setattr(supabase, "upload_file", lambda b, p, d, ct: sent["uploads"].append((b, p, d)))
    monkeypatch.setattr(supabase, "signed_url", lambda b, p, e: f"https://files.test/{p}?token=t")

    def create(order):
        sent["orders"].append(order)
        return {"id": 6412, "payment_url": "https://shop.test/checkout/order-pay/6412/?pay_for_order=true&key=wc_order_k"}

    monkeypatch.setattr(woocommerce, "create_order", create)
    monkeypatch.setattr(woocommerce, "add_order_note", lambda i, n: sent["notes"].append((i, n)))
    return sent


def post(quote=QUOTE, customer=CUSTOMER, file=ZIP):
    return client.post("/api/order", data={"quote": json.dumps(quote), "customer": json.dumps(customer)},
                       files={"file": file} if file else None)


def test_order_creates_pending_woo_order(shop):
    r = post()
    assert r.status_code == 200, r.text
    assert r.json() == {"orderId": 6412, "paymentUrl": "https://shop.test/checkout/order-pay/6412/?pay_for_order=true&key=wc_order_k"}

    quote = client.post("/api/quote", json=QUOTE).json()
    (order,) = shop["orders"]
    assert order["status"] == "pending" and order["set_paid"] is False
    (item,) = order["line_items"]
    assert item["product_id"] == 6309 and item["quantity"] == QUOTE["quantity"]
    assert item["total"] == item["subtotal"] == f"{quote['subtotal']:.2f}"
    assert order["fee_lines"] == [{"name": f"GST ({quote['gstPct']:g}%)", "total": f"{quote['gst']:.2f}", "tax_status": "none"}]
    assert {"key": "Gerber file", "value": "my board.zip"} in item["meta_data"]

    b = order["billing"]
    assert (b["email"], b["phone"], b["state"], b["country"]) == ("asha@example.com", "9876543210", "UP", "IN")
    assert order["shipping"]["postcode"] == "282005" and "email" not in order["shipping"]
    assert order["customer_note"] == "Leave at gate"

    (bucket, path, data), = shop["uploads"]
    assert bucket == "gerbers" and path.endswith("-my_board.zip") and data == ZIP[1]
    (note_id, note), = shop["notes"]
    assert note_id == 6412 and f"https://files.test/{path}?token=t" in note


def test_price_comes_from_server_not_client(shop):
    post(quote={**QUOTE, "pricePerBoard": 0.01, "total": 1})
    assert float(shop["orders"][0]["line_items"][0]["total"]) > 100


@pytest.mark.parametrize("field,value", [("email", "nope"), ("phone", "123"), ("postcode", "28200"), ("firstName", "")])
def test_bad_customer_is_422(shop, field, value):
    r = post(customer={**CUSTOMER, field: value})
    assert r.status_code == 422 and r.json()["detail"][0]["field"] == field
    assert not shop["orders"] and not shop["uploads"]


def test_requires_zip(shop):
    assert post(file=("board.rar", b"x", "application/octet-stream")).status_code == 400
    assert post(file=None).status_code == 422
    assert not shop["orders"]


def test_disabled_without_woo_settings(shop, monkeypatch):
    monkeypatch.setattr(settings, "wc_key", "")
    r = post()
    assert r.status_code == 503 and not shop["orders"]


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
