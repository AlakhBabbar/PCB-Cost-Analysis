from fastapi import APIRouter, Depends, Query

from backend.core.auth import require_admin, require_manager
from backend.core.settings import settings
from backend.services.pricing import store
from backend.services.records import activity, db, woo

router = APIRouter(prefix="/api/admin", tags=["system"])


@router.get("/activity")
def list_activity(page: int = Query(1, ge=1), size: int = Query(50, ge=1, le=100), _: dict = Depends(require_manager)):
    return activity.list_page(page, size)


@router.get("/store")
def store_status(_: dict = Depends(require_admin)):
    return {"wooEnabled": settings.woo_enabled, "storeUrl": settings.wc_url or None,
            "webhookReady": bool(settings.wc_webhook_secret), "lastWebhookAt": woo.last_webhook_at(),
            "pricingReady": store.load_config()[2], "recordsReady": db.ready()}
