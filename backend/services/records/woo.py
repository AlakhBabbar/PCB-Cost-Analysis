import base64
import hashlib
import hmac

from backend.core import woocommerce
from backend.core.settings import settings
from backend.services.records import activity, db, orders

_last = {"at": None}


def verify(raw: bytes, signature: str | None) -> bool:
    if not settings.wc_webhook_secret or not signature:
        return False
    digest = hmac.new(settings.wc_webhook_secret.encode(), raw, hashlib.sha256).digest()
    return hmac.compare_digest(base64.b64encode(digest).decode(), signature.strip())


def handle(payload: dict) -> bool:
    """Apply a verified WooCommerce order payload. False when the order is not ours or records are not set up."""
    _last["at"] = db.now()
    woo_id, status = payload.get("id"), payload.get("status")
    if not isinstance(woo_id, int) or not isinstance(status, str) or not db.ready():
        return False
    row = orders.by_woo(woo_id)
    if not row:
        return False
    orders.apply_woo(row, status)
    return True


def sync(row: dict, admin: dict) -> dict:
    woo = woocommerce.get_order(row["woo_order_id"])
    return orders.apply_woo(row, woo["status"], admin, action="woo_sync")


def last_webhook_at() -> str | None:
    return _last["at"] or activity.last_at(("woo_webhook",))
