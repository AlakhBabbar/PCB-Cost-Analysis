import jwt
from fastapi import Depends, Header, HTTPException

from backend.core.security import decode_token
from backend.services.admins import get_by_id

RANK = {"staff": 0, "manager": 1, "owner": 2}


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    scheme, _, token = (authorization or "").partition(" ")
    try:
        user = get_by_id(decode_token(token)["sub"]) if scheme.lower() == "bearer" else None
    except (jwt.PyJWTError, KeyError):
        user = None
    if not user or user["status"] != "approved":
        raise HTTPException(401, "Not signed in")
    user["role"] = user.get("role") or "owner"  # no role column yet = pre-migration, keep full access
    return user


def _at_least(role: str):
    def dep(user: dict = Depends(require_admin)) -> dict:
        if RANK.get(user["role"], 0) < RANK[role]:
            raise HTTPException(403, "Your role cannot do this")
        return user
    return dep


require_manager = _at_least("manager")
require_owner = _at_least("owner")
