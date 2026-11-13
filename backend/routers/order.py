from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError

from backend.core.settings import settings
from backend.models.order import Customer, OrderResponse
from backend.models.pricing import QuoteRequest
from backend.routers.gerber import read_zip
from backend.services.orders import place_order
from backend.services.pricing.quote import calculate_quote, public_quote
from backend.services.pricing.store import get_config

router = APIRouter(prefix="/api", tags=["order"])


def _errors(exc: ValidationError) -> list[dict]:
    return [{"field": ".".join(map(str, e["loc"])), "msg": e["msg"].removeprefix("Value error, ")} for e in exc.errors()]


@router.post("/order", response_model=OrderResponse)
async def order(quote: str = Form(...), customer: str = Form(...), file: UploadFile = File(...)):
    if not settings.woo_enabled:
        raise HTTPException(503, "Online ordering is not set up yet")
    try:
        req = QuoteRequest.model_validate_json(quote)
        cust = Customer.model_validate_json(customer)
    except ValidationError as exc:
        raise HTTPException(422, _errors(exc))
    name, data = await read_zip(file)
    try:
        priced = public_quote(calculate_quote(req, get_config()))
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    return await run_in_threadpool(place_order, req, priced, cust, data, name)
