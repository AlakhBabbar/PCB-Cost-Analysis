from backend.core import supabase
from backend.services.records import db

T = "activity_log"


def _add(action: str, target_type: str, target_id: str | None, detail: dict | None, admin: dict | None) -> None:
    supabase.insert_rows(T, [{
        "action": action, "target_type": target_type, "target_id": target_id, "detail": detail or {},
        "admin_id": admin["id"] if admin else None, "admin_name": admin["name"] if admin else None,
    }])


def log(action: str, target_type: str, target_id: str | None = None, detail: dict | None = None,
        admin: dict | None = None) -> None:
    db.write(_add, action, target_type, target_id, detail, admin)


def timeline(target_type: str, target_id: str) -> list[dict]:
    rows = supabase.get_rows(T, {"target_type": f"eq.{target_type}", "target_id": f"eq.{target_id}",
                                 "order": "created_at.desc", "limit": 200})
    return [db.camel(r) for r in rows]


def last_at(actions: tuple[str, ...]) -> str | None:
    if not db.ready():
        return None
    row = db.one(supabase.get_rows(T, {"action": f"in.({','.join(actions)})", "select": "created_at",
                                       "order": "created_at.desc", "limit": 1}))
    return row["created_at"] if row else None


def list_page(page: int, size: int) -> dict:
    return db.page(T, {}, page, size)
