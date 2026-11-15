from datetime import datetime, timezone

from backend.core import supabase
from backend.core.security import hash_password

T = "admin_users"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean(row: dict | None) -> dict | None:
    # select * so a missing role column (before 003_records.sql) still works
    return {k: v for k, v in row.items() if k != "password_hash"} if row else None


def _one(rows: list[dict]) -> dict | None:
    return rows[0] if rows else None


def no_role_column(exc: Exception) -> bool:
    return "'role' column" in str(exc)


def get_by_email(email: str) -> dict | None:
    # includes password_hash, sign-in only
    return _one(supabase.get_rows(T, {"email": f"eq.{email.strip().lower()}", "select": "*"}))


def get_by_id(user_id: str) -> dict | None:
    return _clean(_one(supabase.get_rows(T, {"id": f"eq.{user_id}", "select": "*"})))


def create_pending(name: str, phone: str, email: str, password: str, note: str | None) -> dict:
    row = {"name": name, "phone": phone, "email": email.strip().lower(), "password_hash": hash_password(password), "note": note}
    try:
        return _clean(supabase.insert_rows(T, [row], {"select": "*"})[0])
    except supabase.SupabaseError as exc:
        if "23505" in str(exc):
            raise ValueError("already exists") from exc
        raise


def list_users() -> list[dict]:
    return [_clean(r) for r in supabase.get_rows(T, {"select": "*", "order": "status.desc,created_at"})]


def _patch(user_id: str, data: dict) -> dict | None:
    return _clean(_one(supabase.patch_rows(T, {"id": f"eq.{user_id}", "select": "*"}, {**data, "updated_at": _now()})))


def approve(user_id: str, role: str | None = None) -> dict | None:
    try:
        return _patch(user_id, {"status": "approved", **({"role": role} if role else {})})
    except supabase.SupabaseError as exc:
        if role and no_role_column(exc):
            return _patch(user_id, {"status": "approved"})
        raise


def set_role(user_id: str, role: str) -> dict | None:
    return _patch(user_id, {"role": role})


def delete(user_id: str) -> None:
    supabase.delete_rows(T, {"id": f"eq.{user_id}"})


def touch_sign_in(user_id: str) -> None:
    supabase.patch_rows(T, {"id": f"eq.{user_id}", "select": "id"}, {"last_sign_in_at": _now()})
