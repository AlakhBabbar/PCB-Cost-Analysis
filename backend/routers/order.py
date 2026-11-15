from fastapi import APIRouter, Depends, HTTPException

from backend.core.ratelimit import limit
from backend.core.session import session_id
from backend.core.settings import settings
from backend.models.order import OrderRequest, OrderResponse
from backend.routers.pricing import price
from backend.services.orders import FileNotUsable, place_order

router = APIRouter(prefix="/api", tags=["order"])


@router.post("/order", response_model=OrderResponse, dependencies=[Depends(limit("order", 5, 60))])
def order(body: OrderRequest, sid: str | None = Depends(session_id)):
    if not settings.woo_enabled:
        raise HTTPException(503, "Online ordering is not set up yet")
    full, quote = price(body.quote)
    if getattr(quote, "manual", False):
        raise HTTPException(422, "This board needs a custom price. Send it as a quote request instead.")
    try:
        return place_order(body.quote, full, quote, body.customer, body.uploadId, sid)
    except FileNotUsable as exc:
        raise HTTPException(422, str(exc))
