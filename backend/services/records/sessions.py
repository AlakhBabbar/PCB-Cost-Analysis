from datetime import datetime, timedelta, timezone

from backend.core import supabase
from backend.services.pricing import quote, store
from backend.services.records import activity, db

T = "quote_sessions"
STAGES = ("quoted", "file_uploaded", "checkout_started", "manual_requested", "ordered")
QUIET = timedelta(minutes=10)
SEARCH = ("first_name", "last_name", "email", "phone", "company", "note")


def _save(sid: str, stage: str, data: dict, bump: bool = False) -> None:
    old = db.one(supabase.get_rows(T, {"id": f"eq.{sid}", "select": "stage,quote_count"}))
    if old and STAGES.index(old["stage"]) > STAGES.index(stage):
        stage = old["stage"]  # never lower a session's stage
    row = {"id": sid, "stage": stage, "updated_at": db.now(), **data}
    if bump:
        row["quote_count"] = ((old or {}).get("quote_count") or 0) + 1
    supabase.upsert_rows(T, [row])


def _board(req) -> dict:
    return {"board_w": req.boardW, "board_l": req.boardL, "quantity": req.quantity, "layers": req.layers,
            "order_type": req.orderType, "specs": req.model_dump(mode="json")}


def capture_quote(sid: str, req, result) -> None:
    priced = not getattr(result, "manual", False)
    data = {**_board(req), "price_per_board": result.pricePerBoard if priced else None,
            "total": result.total if priced else None}
    db.write(_save, sid, "quoted", data, bump=True)


def _reason(req) -> str | None:
    """Why the engine would not price this board, in the words the buyer saw."""
    if not req:
        return None
    try:
        return quote.calculate_quote(req, store.get_config()).manualReason
    except ValueError as exc:
        return str(exc)


def capture_checkout(sid: str, body) -> None:
    data = db.snake(body.contact.model_dump(exclude_none=True))
    if body.note is not None:
        data["note"] = body.note
    if body.quote:
        data.update(_board(body.quote))
    if body.kind == "manual":
        data.update(handled=False, reason=_reason(body.quote))
    db.write(_save, sid, "manual_requested" if body.kind == "manual" else "checkout_started", data)


def link_upload(sid: str, upload_id: str) -> None:
    db.write(_save, sid, "file_uploaded", {"upload_id": upload_id})


def mark_ordered(sid: str, order_id: str | None) -> None:
    db.write(_save, sid, "ordered", {"order_id": order_id} if order_id else {})


def view_filter(view: str) -> dict:
    if view == "manual":
        return {"stage": "eq.manual_requested"}
    if view == "browsing":
        return {"stage": "in.(quoted,file_uploaded)"}
    quiet = (datetime.now(timezone.utc) - QUIET).isoformat()
    return {"stage": "eq.checkout_started", "order_id": "is.null", "updated_at": f"lt.{quiet}"}


def list_page(view: str, q: str | None, page: int, size: int) -> dict:
    return db.page(T, {**view_filter(view), **db.search(q, SEARCH)}, page, size)


def update(sid: str, handled: bool | None, admin_note: str | None, admin: dict) -> dict | None:
    data = {k: v for k, v in {"handled": handled, "admin_note": admin_note}.items() if v is not None}
    row = db.one(supabase.patch_rows(T, {"id": f"eq.{sid}"}, data))
    if row and handled is not None:
        activity.log("session_handled" if handled else "session_reopened", "session", sid, admin=admin)
    if row and admin_note is not None:
        activity.log("session_note", "session", sid, {"note": admin_note}, admin=admin)
    return db.camel(row)
