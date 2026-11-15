from backend.core import supabase
from backend.services.records import activity, db, uploads

T = "orders"
PAYMENT = {"processing": "paid", "completed": "paid", "pending": "pending", "on-hold": "pending",
           "failed": "failed", "refunded": "refunded", "cancelled": "cancelled"}
STAGES = ("new", "file_review", "in_production", "quality_check", "shipped", "delivered", "cancelled")
SEARCH = ("first_name", "last_name", "email", "phone", "company", "city")
CUSTOMER = ("first_name", "last_name", "email", "phone", "company", "gstin",
            "address1", "address2", "city", "state", "postcode")
MONEY = ("quantity", "price_per_board", "eng_fee", "subtotal", "gst", "total")


def insert(row: dict) -> str | None:
    saved = db.write(supabase.insert_rows, T, [row])
    return saved[0]["id"] if saved else None


def get(order_id: str) -> dict | None:
    return db.one(supabase.get_rows(T, {"id": f"eq.{order_id}"}))


def by_woo(woo_id: int) -> dict | None:
    return db.one(supabase.get_rows(T, {"woo_order_id": f"eq.{woo_id}"}))


def apply_woo(row: dict, woo_status: str, admin: dict | None = None, action: str = "woo_webhook") -> dict:
    """Map a WooCommerce status onto the order and log a payment change."""
    pay = PAYMENT.get(woo_status, row.get("payment_status"))
    new = db.one(supabase.patch_rows(T, {"id": f"eq.{row['id']}"},
                                     {"woo_status": woo_status, "payment_status": pay, "updated_at": db.now()})) or row
    if pay != row.get("payment_status"):
        activity.log(action, "order", row["id"],
                     {"from": row.get("payment_status"), "to": pay, "wooStatus": woo_status, "wooOrderId": row.get("woo_order_id")}, admin)
    return new


def status_filter(status: str | None) -> dict:
    if not status:
        return {}
    if status == "review":
        return {"needs_review": "is.true"}
    return {"stage" if status in STAGES else "payment_status": f"eq.{status}"}


def _item(r: dict) -> dict:
    return db.camel({k: r.get(k) for k in ("id", "created_at", "woo_order_id", "payment_status", "stage",
                                           "needs_review", "first_name", "last_name", "company", "email",
                                           "city", "quantity", "total")}) | {
        k: (r.get("specs") or {}).get(k) for k in ("boardW", "boardL", "layers")}


def list_page(status: str | None, q: str | None, page: int, size: int) -> dict:
    return db.page(T, {**status_filter(status), **db.search(q, SEARCH)}, page, size, _item)


def _pick(row: dict, keys: tuple[str, ...]) -> dict:
    return db.camel({k: row.get(k) for k in keys})


def margin(row: dict) -> dict | None:
    price, cost, qty = row.get("price_per_board"), row.get("cost_per_board"), row.get("quantity") or 0
    if price is None or cost is None:
        return None
    per = price - cost
    return {"costPerBoard": cost, "perBoard": round(per, 2), "total": round(per * qty, 2),
            "marginPct": round(per / price * 100, 1) if price else 0}


def detail(row: dict) -> dict:
    head = ("id", "created_at", "updated_at", "woo_order_id", "woo_status", "payment_status", "stage",
            "needs_review", "review_reasons", "customer_note", "admin_note", "payment_url", "session_id", "specs",
            "summary")
    file = uploads.get(row["upload_id"]) if row.get("upload_id") else None
    return {**_pick(row, head), "customer": _pick(row, CUSTOMER), "money": _pick(row, MONEY), "margin": margin(row),
            "file": db.camel(file), "timeline": activity.timeline("order", row["id"])}


def update(row: dict, stage: str | None, admin_note: str | None, admin: dict) -> dict:
    data = {k: v for k, v in {"stage": stage, "admin_note": admin_note}.items() if v is not None}
    new = db.one(supabase.patch_rows(T, {"id": f"eq.{row['id']}"}, {**data, "updated_at": db.now()})) or row
    if stage is not None and stage != row.get("stage"):
        activity.log("order_stage", "order", row["id"], {"from": row.get("stage"), "to": stage, "wooOrderId": row.get("woo_order_id")}, admin)
    if admin_note is not None:
        activity.log("order_note", "order", row["id"], {"note": admin_note, "wooOrderId": row.get("woo_order_id")}, admin)
    return new
