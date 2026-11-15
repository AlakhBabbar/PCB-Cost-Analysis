from fastapi import APIRouter, Depends, HTTPException

from backend.core.auth import require_admin
from backend.core.ratelimit import limit
from backend.core.security import hash_password, make_token, verify_password
from backend.models.admins import SigninRequest, SignupRequest
from backend.services import admins

router = APIRouter(prefix="/api/auth", tags=["auth"])
_DUMMY = hash_password("timing-dummy")


@router.post("/signup", status_code=201, dependencies=[Depends(limit("signup", 5, 3600))])
def signup(req: SignupRequest):
    try:
        admins.create_pending(req.name, req.phone, req.email, req.password, req.note)
    except ValueError:
        raise HTTPException(409, "An account with this email already exists")
    return {"status": "pending"}


@router.post("/signin", dependencies=[Depends(limit("signin", 10, 60))])
def signin(req: SigninRequest):
    user = admins.get_by_email(req.email)
    ok = verify_password(user["password_hash"] if user else _DUMMY, req.password)
    if not (user and ok):
        raise HTTPException(401, "Invalid email or password")
    if user["status"] != "approved":
        raise HTTPException(403, "pending")
    admins.touch_sign_in(user["id"])
    out = {k: user[k] for k in ("id", "name", "email")}
    return {"token": make_token(user["id"], user["email"]), "user": {**out, "role": user.get("role") or "owner"}}


@router.get("/me")
def me(user: dict = Depends(require_admin)):
    return {k: user[k] for k in ("id", "name", "email", "phone", "status", "role")}
