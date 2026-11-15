from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from backend.core.ratelimit import limit
from backend.core.session import session_id
from backend.core.settings import settings
from backend.models.pricing import QuoteRequest
from backend.services.pricing import options as pricing_options, quote as engine, store
from backend.services.records import sessions

router = APIRouter(prefix="/api", tags=["pricing"])


def price(req: QuoteRequest):
    """(full admin result, public result) priced on the server; 422 when the board is blocked."""
    try:
        full = engine.calculate_quote(req, store.get_config())
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    return full, engine.public_quote(full)


@router.get("/pricing/options")
def options():
    return pricing_options.form_options(store.get_config()) | {"maxUploadMb": settings.max_upload_mb, "directUpload": settings.direct_upload}


@router.post("/quote", dependencies=[Depends(limit("quote", 120, 60))])
def quote(req: QuoteRequest, tasks: BackgroundTasks, sid: str | None = Depends(session_id)):
    result = price(req)[1]
    if sid:
        tasks.add_task(sessions.capture_quote, sid, req, result)
    return result
