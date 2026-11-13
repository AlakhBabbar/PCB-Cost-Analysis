"""Turn a priced quote into a WooCommerce order. The price is always recalculated here, never taken from the browser."""
import logging
import re
import uuid
from datetime import date

from backend.core import supabase, woocommerce
from backend.core.settings import settings
from backend.models.order import Customer, OrderResponse
from backend.models.pricing import QuoteRequest, QuoteResponse

log = logging.getLogger(__name__)
LINK_SECONDS = 5 * 365 * 24 * 3600  # Gerber download link in the order stays valid for 5 years


def store_gerber(data: bytes, filename: str) -> tuple[str, str]:
    """Save the zip in a private bucket. Returns (storage path, long-lived download link)."""
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("_") or "gerber.zip"
    path = f"{date.today():%Y/%m}/{uuid.uuid4().hex[:12]}-{safe}"
    supabase.ensure_bucket(settings.gerber_bucket)
    supabase.upload_file(settings.gerber_bucket, path, data, "application/zip")
    return path, supabase.signed_url(settings.gerber_bucket, path, LINK_SECONDS)


def build_order(req: QuoteRequest, quote: QuoteResponse, c: Customer, filename: str, gerber_path: str) -> dict:
    address = {
        "first_name": c.firstName, "last_name": c.lastName,
        "address_1": c.address1, "address_2": c.address2,
        "city": c.city, "state": c.state, "postcode": c.postcode, "country": "IN", "phone": c.phone,
    }
    specs = [{"key": k, "value": v} for k, v in quote.summary.items()]
    specs += [{"key": "Price per board", "value": f"₹{quote.pricePerBoard:,.2f}"}]
    if quote.engFee:
        specs += [{"key": "Engineering fee (included)", "value": f"₹{quote.engFee:,.2f}"}]
    specs += [{"key": "Gerber file", "value": filename}]
    amount = f"{quote.subtotal:.2f}"
    return {
        "status": "pending",
        "set_paid": False,
        "billing": {**address, "email": c.email},
        "shipping": address,
        "customer_note": c.note,
        "line_items": [{
            "product_id": settings.wc_product_id,
            "quantity": quote.quantity,
            "subtotal": amount,
            "total": amount,
            "meta_data": specs,
        }],
        "fee_lines": [{"name": f"GST ({quote.gstPct:g}%)", "total": f"{quote.gst:.2f}", "tax_status": "none"}],
        "meta_data": [
            {"key": "_pcb_quote_request", "value": req.model_dump_json()},
            {"key": "_pcb_gerber_path", "value": gerber_path},
        ],
    }


def place_order(req: QuoteRequest, quote: QuoteResponse, c: Customer, data: bytes, filename: str) -> OrderResponse:
    path, link = store_gerber(data, filename)
    order = woocommerce.create_order(build_order(req, quote, c, filename, path))
    try:
        woocommerce.add_order_note(order["id"], f"PCB quote app order.\nGerber file: {filename}\nDownload: {link}")
    except woocommerce.WooError:
        log.exception("Order %s created but the Gerber note failed; file is at %s", order["id"], path)
    return OrderResponse(orderId=order["id"], paymentUrl=order["payment_url"])
