import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.core.auth import require_admin
from backend.models.records import OrderPatch, SessionPatch
from backend.services.records import db, orders, sessions, summary, uploads, woo

router = APIRouter(prefix="/api/admin", tags=["sales"])
Page = Query(1, ge=1)
Size = Query(25, ge=1, le=100)


def _order(order_id: uuid.UUID) -> dict:
    db.require_ready()
    row = orders.get(str(order_id))
    if not row:
        raise HTTPException(404, "Order not found")
    return row


@router.get("/summary")
def get_summary(days: int = Query(14, ge=1, le=90), _: dict = Depends(require_admin)):
    return summary.summary(days)


@router.get("/orders")
def list_orders(status: str | None = None, q: str | None = None, page: int = Page, size: int = Size,
                _: dict = Depends(require_admin)):
    return orders.list_page(status, q, page, size)


@router.get("/orders/{order_id}")
def get_order(order_id: uuid.UUID, _: dict = Depends(require_admin)):
    return orders.detail(_order(order_id))


@router.patch("/orders/{order_id}")
def patch_order(order_id: uuid.UUID, body: OrderPatch, me: dict = Depends(require_admin)):
    return orders.detail(orders.update(_order(order_id), body.stage, body.adminNote, me))


@router.post("/orders/{order_id}/sync")
def sync_order(order_id: uuid.UUID, me: dict = Depends(require_admin)):
    row = _order(order_id)
    if not row.get("woo_order_id"):
        raise HTTPException(409, "This order has no WooCommerce order")
    return orders.detail(woo.sync(row, me))


@router.get("/sessions")
def list_sessions(view: Literal["abandoned", "manual", "browsing"] = "abandoned", q: str | None = None,
                  page: int = Page, size: int = Size, _: dict = Depends(require_admin)):
    return sessions.list_page(view, q, page, size)


@router.patch("/sessions/{session_id}")
def patch_session(session_id: uuid.UUID, body: SessionPatch, me: dict = Depends(require_admin)):
    db.require_ready()
    row = sessions.update(str(session_id), body.handled, body.adminNote, me)
    if not row:
        raise HTTPException(404, "Session not found")
    return row


@router.get("/customers")
def list_customers(q: str | None = None, page: int = Page, size: int = Size, _: dict = Depends(require_admin)):
    params = {"order": "last_order_at.desc", **db.search(q, ("email", "first_name", "last_name", "phone", "company"))}
    return db.page("customers", params, page, size)


@router.get("/files")
def list_files(q: str | None = None, page: int = Page, size: int = Size, _: dict = Depends(require_admin)):
    return uploads.list_page(q, page, size)


@router.get("/files/{upload_id}/link")
def file_link(upload_id: uuid.UUID, me: dict = Depends(require_admin)):
    db.require_ready()
    url = uploads.link(str(upload_id), me)
    if not url:
        raise HTTPException(404, "File not found")
    return {"url": url}
