from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

from backend.core.security import decode_token, hash_password, make_token, verify_password
from backend.core.settings import settings
from backend.main import app
from backend.services import admins
from backend.tests.conftest import add_admin

client = TestClient(app)
SIGNUP = {"name": "Tester", "phone": "98765 43210", "email": "Tee@X.com", "password": "longenough", "note": "ops"}


def test_password_hash():
    h = hash_password("secret123")
    assert h != "secret123" and verify_password(h, "secret123")
    assert not verify_password(h, "wrong") and not verify_password("not-a-hash", "secret123")


def test_token():
    assert decode_token(make_token("u1", "a@x.com"))["sub"] == "u1"
    old = jwt.encode({"sub": "u1", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)}, settings.jwt_secret, algorithm="HS256")
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(old)
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {old}"}).status_code == 401


def test_signup(db):
    db = db.tables["admin_users"]
    r = client.post("/api/auth/signup", json=SIGNUP)
    assert r.status_code == 201 and r.json() == {"status": "pending"}
    assert db[0]["email"] == "tee@x.com" and db[0]["status"] == "pending" and db[0]["password_hash"] != "longenough"
    r = client.post("/api/auth/signup", json={**SIGNUP, "email": "tee@x.com"})
    assert r.status_code == 409 and r.json()["detail"] == "An account with this email already exists"


def test_signup_validation(db):
    for bad in ({"email": "nope"}, {"password": "short"}, {"phone": "12"}, {"name": ""}):
        assert client.post("/api/auth/signup", json={**SIGNUP, **bad}).status_code == 422


def test_signin_flow(db):
    db = db.tables["admin_users"]
    client.post("/api/auth/signup", json=SIGNUP)
    creds = {"email": "tee@x.com", "password": "longenough"}
    r = client.post("/api/auth/signin", json=creds)
    assert r.status_code == 403 and r.json()["detail"] == "pending"
    admins.approve(db[0]["id"])
    for bad in ({**creds, "password": "wrongpass"}, {**creds, "email": "who@x.com"}):
        r = client.post("/api/auth/signin", json=bad)
        assert r.status_code == 401 and r.json()["detail"] == "Invalid email or password"
    r = client.post("/api/auth/signin", json={**creds, "email": " TEE@x.com"})
    assert r.status_code == 200 and r.json()["user"] == {"id": db[0]["id"], "name": "Tester", "email": "tee@x.com", "role": "owner"}
    assert db[0]["last_sign_in_at"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {r.json()['token']}"})
    assert me.status_code == 200 and me.json() == {"id": db[0]["id"], "name": "Tester", "email": "tee@x.com", "phone": "98765 43210", "status": "approved", "role": "owner"}


def test_deleted_user_rejected(db):
    row, headers = add_admin("gone@x.com")
    assert client.get("/api/auth/me", headers=headers).status_code == 200
    admins.delete(row["id"])
    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_bad_tokens(db):
    for h in ({}, {"Authorization": "Bearer junk"}, {"Authorization": "Basic x"}):
        assert client.get("/api/auth/me", headers=h).status_code == 401


def test_signin_rate_limited(db):
    codes = [client.post("/api/auth/signin", json={"email": "x@x.com", "password": "nope"}).status_code for _ in range(11)]
    assert codes[-1] == 429 and r"Too many" in client.post("/api/auth/signin", json={}).json()["detail"]


def test_role_from_column(db):
    _, h = add_admin("m@x.com", role="manager")
    assert client.get("/api/auth/me", headers=h).json()["role"] == "manager"
