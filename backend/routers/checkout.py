from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from backend.core.ratelimit import limit
from backend.core.session import session_id
from backend.models.records import CheckoutRequest
from backend.services.records import sessions

router = APIRouter(prefix="/api", tags=["checkout"])


@router.post("/checkout", status_code=204, dependencies=[Depends(limit("checkout", 30, 60))])
def checkout(body: CheckoutRequest, tasks: BackgroundTasks, sid: str | None = Depends(session_id)):
    if not sid:
        raise HTTPException(400, "Missing X-Session-Id header")
    tasks.add_task(sessions.capture_checkout, sid, body)
