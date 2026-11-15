"""Turn a priced quote into a WooCommerce order. The price is always recalculated, never taken from the browser."""
import logging

from backend.core import woocommerce
from backend.core.settings import settings
from backend.models.order import Customer, OrderResponse
from backend.models.pricing import QuoteRequest
from backend.services.records import activity, orders, sessions, uploads
from backend.services.records.review import review_reasons

log = logging.getLogger(__name__)


class FileNotUsable(Exception):
    pass


def _money(v: float) -> str:
    return f"₹{v:,.2f}"


def build_order(req: QuoteRequest, quote, c: Customer, filename: str, upload_id: str) -> dict:
    address = {
        "first_name": c.firstName, "last_name": c.lastName, "company": c.company,
        "address_1": c.address1, "address_2": c.address2,
        "city": c.city, "state": c.state, "postcode": c.postcode, "country": "IN", "phone": c.phone,
    }
    specs = [{"key": k, "value": v} for k, v in quote.summary.items()]
    specs += [{"key": "Price per board", "value": _money(quote.pricePerBoard)}]
    if quote.engFee:
        specs += [{"key": "Engineering fee (included)", "value": _money(quote.engFee)}]
    specs += [{"key": "Gerber file", "value": filename}]
    amount = f"{quote.subtotal:.2f}"
    meta = [{"key": "_pcb_quote_request", "value": req.model_dump_json()},
            {"key": "_pcb_upload_id", "value": upload_id},
            {"key": "_pcb_gerber_path", "value": uploads.path_for(upload_id)}]
    if c.company:
        meta.append({"key": "Company", "value": c.company})
    if c.gstin:
        meta.append({"key": "GSTIN", "value": c.gstin})
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
        "meta_data": meta,
    }


def _record(req, full, quote, c: Customer, woo: dict, upload_id: str, sid: str | None, reasons: list[str]) -> dict:
    return {
        "session_id": sid, "upload_id": upload_id, "woo_order_id": woo["id"], "woo_status": woo.get("status", "pending"),
        "payment_status": "pending", "stage": "new", "needs_review": bool(reasons), "review_reasons": reasons,
        "first_name": c.firstName, "last_name": c.lastName, "email": c.email, "phone": c.phone, "company": c.company,
        "gstin": c.gstin, "address1": c.address1, "address2": c.address2, "city": c.city, "state": c.state,
        "postcode": c.postcode, "customer_note": c.note, "specs": req.model_dump(mode="json"), "summary": quote.summary,
        "quantity": quote.quantity, "price_per_board": quote.pricePerBoard, "eng_fee": quote.engFee,
        "subtotal": quote.subtotal, "gst": quote.gst, "total": quote.total,
        "cost_per_board": getattr(full, "costPerBoard", None), "payment_url": woo["payment_url"],
    }


def place_order(req: QuoteRequest, full, quote, c: Customer, upload_id: str, sid: str | None) -> OrderResponse:
    upload = uploads.get(upload_id)
    if upload and not upload.get("parse_ok"):
        raise FileNotUsable("This Gerber file could not be read, so it cannot be ordered. Please upload another file.")
    reasons = review_reasons(req, upload)
    filename = upload["filename"] if upload else "Gerber file"
    woo = woocommerce.create_order(build_order(req, quote, c, filename, upload_id))
    try:
        woocommerce.add_order_note(woo["id"], f"PCB quote app order.\nGerber file: {filename}\nThe file is in the admin panel under Files.")
    except woocommerce.WooError:
        log.exception("Order %s created but the note failed", woo["id"])
    order_id = orders.insert(_record(req, full, quote, c, woo, upload_id, sid, reasons))
    if order_id:
        uploads.set_order(upload_id, order_id)
        activity.log("order_created", "order", order_id, {"wooOrderId": woo["id"], "needsReview": bool(reasons)})
    if sid:
        sessions.mark_ordered(sid, order_id, c)
    return OrderResponse(orderId=woo["id"], paymentUrl=woo["payment_url"])
