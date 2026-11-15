import logging
import uuid

from backend.core import supabase
from backend.core.settings import settings
from backend.models.gerber import ParsedGerberResult
from backend.services.records import activity, db, sessions

log = logging.getLogger(__name__)
T = "uploads"
LINK_SECONDS = 300
_bucket = {"ok": False}


def path_for(upload_id: str) -> str:
    return f"uploads/{upload_id}.zip"


def usable(result: ParsedGerberResult) -> bool:
    return not result.errors and result.dimensions is not None


def store(sid: str | None, filename: str, data: bytes, result: ParsedGerberResult) -> str | None:
    """Save the zip once in the private bucket and record it. Returns the upload id, None when storage failed."""
    upload_id = str(uuid.uuid4())
    try:
        if not _bucket["ok"]:
            supabase.ensure_bucket(settings.gerber_bucket)
            _bucket["ok"] = True
        supabase.upload_file(settings.gerber_bucket, path_for(upload_id), data, "application/zip")
    except supabase.SupabaseError as exc:
        log.warning("Gerber upload failed: %s", str(exc)[:200])
        return None
    dims = result.dimensions
    db.write(supabase.insert_rows, T, [{
        "id": upload_id, "session_id": sid, "filename": filename, "size_bytes": len(data),
        "storage_path": path_for(upload_id), "width_mm": dims.width_mm if dims else None,
        "height_mm": dims.height_mm if dims else None, "copper_layers": result.copper_layer_count,
        "min_drill_mm": result.drill.min_drill_mm, "parse_ok": usable(result), "warnings": result.warnings,
    }])
    if sid:
        sessions.link_upload(sid, upload_id)
    return upload_id


def get(upload_id: str) -> dict | None:
    """The uploads row, or None when it is missing or cannot be read."""
    try:
        return db.one(supabase.get_rows(T, {"id": f"eq.{upload_id}"})) if db.ready() else None
    except supabase.SupabaseError as exc:
        log.warning("uploads row %s unreadable: %s", upload_id, str(exc)[:200])
        return None


def set_order(upload_id: str, order_id: str) -> None:
    db.write(supabase.patch_rows, T, {"id": f"eq.{upload_id}"}, {"order_id": order_id})


def list_page(q: str | None, page: int, size: int) -> dict:
    out = db.page(T, db.search(q, ("filename",)), page, size)
    ids = ",".join({f["orderId"] for f in out["items"] if f.get("orderId")})
    found = supabase.get_rows("orders", {"id": f"in.({ids})", "select": "id,woo_order_id,first_name,last_name"}) if ids else []
    orders = {o["id"]: o for o in found}
    for f in out["items"]:
        o = orders.get(f.get("orderId")) or {}
        f.update(wooOrderId=o.get("woo_order_id"), customerName=" ".join(filter(None, (o.get("first_name"), o.get("last_name")))) or None)
    return out


def link(upload_id: str, admin: dict) -> str | None:
    row = db.one(supabase.get_rows(T, {"id": f"eq.{upload_id}"}))
    if not row:
        return None
    url = supabase.signed_url(settings.gerber_bucket, row["storage_path"], LINK_SECONDS)
    activity.log("file_link", "upload", upload_id, {"filename": row["filename"]}, admin)
    return url
