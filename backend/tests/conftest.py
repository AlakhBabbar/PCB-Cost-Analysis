import pytest

from backend.core import ratelimit, supabase, woocommerce
from backend.core.security import make_token
from backend.services import admins
from backend.services.pricing import store
from backend.services.records import db as records_db, uploads, woo
from backend.tests.fakedb import FakeDB


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    def boom(*a, **kw):
        raise supabase.SupabaseError("offline")

    def no_shop(*a, **kw):
        raise woocommerce.WooError("offline")
    monkeypatch.setattr(supabase, "_send", boom)
    monkeypatch.setattr(woocommerce, "_request", no_shop)
    monkeypatch.setattr(store, "_cache", None)
    monkeypatch.setitem(records_db._state, "ready", None)
    monkeypatch.setitem(uploads._bucket, "ok", False)
    monkeypatch.setitem(woo._last, "at", None)
    ratelimit._hits.clear()


@pytest.fixture
def db(monkeypatch) -> FakeDB:
    return FakeDB().install(monkeypatch)


def add_admin(email: str, approved: bool = True, role: str | None = None) -> tuple[dict, dict]:
    """Create a user through the service; returns (row, auth headers)."""
    row = admins.create_pending("Test", "12345", email, "longenough", None)
    if approved:
        row = admins.approve(row["id"], role)
    return row, {"Authorization": f"Bearer {make_token(row['id'], row['email'])}"}
