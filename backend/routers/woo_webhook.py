import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool

from backend.core.settings import settings
from backend.services.records import woo

router = APIRouter(prefix="/api/woo", tags=["woocommerce"])


@router.post("/webhook")
async def webhook(request: Request):
    raw = await request.body()
    if raw.startswith(b"webhook_id="):  # ping WooCommerce sends when the webhook is created
        return {"ok": True}
    if not settings.wc_webhook_secret:
        raise HTTPException(503, "WC_WEBHOOK_SECRET is not set")
    if not woo.verify(raw, request.headers.get("x-wc-webhook-signature")):
        raise HTTPException(401, "Bad signature")
    try:
        payload = json.loads(raw)
    except ValueError:
        raise HTTPException(400, "Body is not JSON")
    handled = await run_in_threadpool(woo.handle, payload) if isinstance(payload, dict) else False
    return {"ok": True, "handled": handled}
