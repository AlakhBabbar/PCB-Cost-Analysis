import logging
import re
import time
from datetime import datetime, timezone

from fastapi import HTTPException

from backend.core import supabase

log = logging.getLogger(__name__)
TTL = 30
SETUP = "Records are not set up. Run supabase/migrations/003_records.sql in the Supabase SQL editor."
_state: dict = {"ready": None, "at": 0.0}


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_missing(exc: Exception) -> bool:
    s = str(exc)
    return "PGRST205" in s or "42P01" in s or "Could not find the table" in s


def _mark(ok: bool) -> bool:
    _state.update(ready=ok, at=time.monotonic())
    return ok


def ready() -> bool:
    """True when the records tables exist. Cached for TTL seconds."""
    if _state["ready"] is not None and time.monotonic() - _state["at"] < TTL:
        return _state["ready"]
    try:
        supabase.get_rows("orders", {"select": "id", "limit": 1})
        return _mark(True)
    except supabase.SupabaseError as exc:
        if is_missing(exc):
            return _mark(False)
        raise


def require_ready() -> None:
    if not ready():
        raise HTTPException(503, SETUP)


def write(fn, *args, **kw):
    """A records write from the public flow: never breaks the caller, logged and skipped on failure."""
    try:
        if ready():
            return fn(*args, **kw)
        log.info("records write skipped, tables missing: %s", fn.__name__)
    except Exception as exc:
        if is_missing(exc):
            _mark(False)
        log.warning("records write %s failed: %s", fn.__name__, str(exc)[:200])
    return None


def one(rows: list[dict]) -> dict | None:
    return rows[0] if rows else None


def search(q: str | None, cols: tuple[str, ...]) -> dict:
    q = re.sub(r'[,()*:"\\]', " ", q or "").strip()
    return {"or": "(" + ",".join(f"{c}.ilike.*{q}*" for c in cols) + ")"} if q else {}


def page(table: str, params: dict, page: int, size: int, item=None) -> dict:
    """Newest first page as {items, total, ready}; empty when the tables are missing."""
    if not ready():
        return {"items": [], "total": 0, "ready": False}
    rows, total = supabase.get_page(table, {"order": "created_at.desc", **params}, size, (page - 1) * size)
    return {"items": [(item or camel)(r) for r in rows], "total": total, "ready": True}


def _camel_key(k: str) -> str:
    head, *rest = k.split("_")
    return head + "".join(w.title() for w in rest)


def camel(row: dict | None, drop: tuple[str, ...] = ()) -> dict | None:
    if row is None:
        return None
    return {_camel_key(k): v for k, v in row.items() if k not in drop}


def snake(data: dict) -> dict:
    return {re.sub(r"(?<!^)([A-Z])", r"_\1", k).lower(): v for k, v in data.items()}
