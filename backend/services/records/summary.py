from datetime import datetime, timedelta, timezone

from backend.core import supabase
from backend.services.records import db, sessions

IST = timezone(timedelta(hours=5, minutes=30))


def _day(ts: str) -> str:
    return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(IST).date().isoformat()


def _start(d) -> str:
    return datetime.combine(d, datetime.min.time(), IST).isoformat()


def _empty(days: list[str]) -> dict:
    return {"ready": False, "today": {"orders": 0, "revenue": 0, "quotes": 0, "abandoned": 0},
            "funnel": {"quoted": 0, "uploaded": 0, "checkout": 0, "ordered": 0, "paid": 0},
            "series": [{"date": d, "orders": 0, "revenue": 0, "quotes": 0} for d in days], "attention": []}


def _attention() -> list[dict]:
    items = [
        ("review", "Orders whose file needs a check", "/admin/orders?status=review", "orders", {"needs_review": "is.true", "stage": "eq.new"}),
        ("paid", "Paid orders not started yet", "/admin/orders?status=paid", "orders", {"payment_status": "eq.paid", "stage": "eq.new"}),
        ("abandoned", "Abandoned checkouts to follow up", "/admin/abandoned", sessions.T, {**sessions.view_filter("abandoned"), "handled": "is.false"}),
        ("manual", "Quote requests waiting for a price", "/admin/requests", sessions.T, {**sessions.view_filter("manual"), "handled": "is.false"}),
    ]
    out = [{"kind": k, "label": label, "count": supabase.count(t, p), "to": to} for k, label, to, t, p in items]
    return [a for a in out if a["count"]]


def summary(days: int) -> dict:
    today = datetime.now(IST).date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(days - 1, -1, -1)]
    out = _empty(dates)
    if not db.ready():
        return out
    window = {"created_at": f"gte.{_start(today - timedelta(days=days - 1))}", "limit": 10000}
    orders = supabase.get_rows("orders", {"select": "created_at,total,payment_status", **window})
    quotes = supabase.get_rows(sessions.T, {"select": "created_at,stage,upload_id,order_id", **window})
    series = {s["date"]: s for s in out["series"]}
    for o in orders:
        if s := series.get(_day(o["created_at"])):
            s["orders"] += 1
            s["revenue"] += (o["total"] or 0) if o["payment_status"] == "paid" else 0
    for q in quotes:
        if s := series.get(_day(q["created_at"])):
            s["quotes"] += 1
    t = series[dates[-1]]
    out.update(ready=True, attention=_attention(), today={
        "orders": t["orders"], "revenue": round(t["revenue"], 2), "quotes": t["quotes"],
        "abandoned": supabase.count(sessions.T, {**sessions.view_filter("abandoned"), "created_at": f"gte.{_start(today)}"}),
    }, funnel={
        "quoted": len(quotes),
        "uploaded": sum(1 for q in quotes if q.get("upload_id")),
        "checkout": sum(1 for q in quotes if q["stage"] in ("checkout_started", "ordered")),
        "ordered": sum(1 for q in quotes if q["stage"] == "ordered"),
        "paid": sum(1 for o in orders if o["payment_status"] == "paid"),
    })
    for s in out["series"]:
        s["revenue"] = round(s["revenue"], 2)
    return out
