from fastapi import APIRouter, Depends, HTTPException

from backend.core.auth import require_owner
from backend.core.supabase import SupabaseError
from backend.models.admins import AdminUser, to_admin_user
from backend.models.records import RoleBody
from backend.services import admins
from backend.services.records import activity
from backend.services.records.db import SETUP

router = APIRouter(prefix="/api/admin", tags=["team"])


def _role(u: dict) -> str:
    return u.get("role") or "owner"


def _target(user_id: str, leaving_owner: bool) -> dict:
    users = admins.list_users()
    target = next((u for u in users if u["id"] == user_id), None)
    if not target:
        raise HTTPException(404, "User not found")
    owners = [u for u in users if u["status"] == "approved" and _role(u) == "owner"]
    if leaving_owner and target in owners and len(owners) <= 1:
        raise HTTPException(409, "The last owner cannot be removed or demoted")
    return target


@router.get("/users")
def get_users(me: dict = Depends(require_owner)):
    return {"users": [to_admin_user(r, me["id"]) for r in admins.list_users()]}


@router.post("/users/{user_id}/approve", response_model=AdminUser)
def approve_user(user_id: str, body: RoleBody | None = None, me: dict = Depends(require_owner)):
    role = body.role if body else "staff"
    row = admins.approve(user_id, role)
    if not row:
        raise HTTPException(404, "User not found")
    activity.log("team_approve", "admin_user", user_id, {"name": row["name"], "role": role}, me)
    return to_admin_user(row, me["id"])


@router.patch("/users/{user_id}", response_model=AdminUser)
def set_role(user_id: str, body: RoleBody, me: dict = Depends(require_owner)):
    target = _target(user_id, body.role != "owner")
    try:
        row = admins.set_role(user_id, body.role)
    except SupabaseError as exc:
        if admins.no_role_column(exc):
            raise HTTPException(503, SETUP)
        raise
    activity.log("team_role", "admin_user", user_id, {"name": row["name"], "from": _role(target), "to": body.role}, me)
    return to_admin_user(row, me["id"])


@router.delete("/users/{user_id}", status_code=204)
def remove_user(user_id: str, me: dict = Depends(require_owner)):
    if user_id == me["id"]:
        raise HTTPException(403, "You cannot remove yourself")
    target = _target(user_id, True)
    admins.delete(user_id)
    activity.log("team_remove", "admin_user", user_id, {"name": target["name"]}, me)
