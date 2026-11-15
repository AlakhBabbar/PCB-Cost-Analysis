import io
import zipfile
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from backend.core import ratelimit, supabase
from backend.services.gerber.zipcheck import check_zip
from backend.services.records import db as records
from backend.services.records.review import review_reasons


def req(ip: str) -> Request:
    return Request({"type": "http", "client": (ip, 1), "headers": []})


def test_rate_limit_per_ip_and_window(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(ratelimit.time, "monotonic", lambda: now[0])
    dep = ratelimit.limit("t", 2, 60)
    dep(req("a"))
    dep(req("a"))
    with pytest.raises(HTTPException) as e:
        dep(req("a"))
    assert e.value.status_code == 429
    dep(req("b"))
    now[0] += 61
    dep(req("a"))


def make_zip(entries: dict) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for name, data in entries.items():
            z.writestr(name, data)
    return buf.getvalue()


def test_zip_checks(monkeypatch):
    check_zip(make_zip({"top.gtl": "x", "sub/drill.drl": "y"}))
    for bad in ({"/abs.gtl": "x"}, {"a/../../b": "x"}, {"C:/win.gtl": "x"}):
        with pytest.raises(ValueError):
            check_zip(make_zip(bad))
    monkeypatch.setattr("backend.services.gerber.zipcheck.MAX_ENTRIES", 2)
    with pytest.raises(ValueError, match="more than 2"):
        check_zip(make_zip({"a": "", "b": "", "c": ""}))
    with pytest.raises(ValueError):
        check_zip(b"not a zip")


def test_review_reasons():
    q = SimpleNamespace(boardW=130, boardL=80, layers="2", minHole="0.30")
    up = {"width_mm": 81.5, "height_mm": 129, "copper_layers": 2, "min_drill_mm": 0.3}
    assert review_reasons(q, up) == []
    assert len(review_reasons(q, {**up, "width_mm": 90, "copper_layers": 4, "min_drill_mm": 0.2})) == 3
    assert review_reasons(q, None)


def test_camel_and_snake():
    assert records.camel({"woo_order_id": 1, "address1": "x", "password_hash": "h"}, drop=("password_hash",)) == {"wooOrderId": 1, "address1": "x"}
    assert records.snake({"firstName": "a", "address1": "b"}) == {"first_name": "a", "address1": "b"}


def test_search_strips_postgrest_syntax():
    assert records.search("a,b(c)*", ("email",)) == {"or": "(email.ilike.*a b c*)"}
    assert records.search("  ", ("email",)) == {}


def test_missing_tables_detected_once_and_writes_skipped(monkeypatch):
    calls = []

    def gone(t, p):
        calls.append(t)
        raise supabase.SupabaseError('{"code":"PGRST205"}')
    monkeypatch.setattr(supabase, "get_rows", gone)
    assert records.ready() is False and records.ready() is False and len(calls) == 1
    assert records.write(lambda: 1 / 0) is None
    with pytest.raises(HTTPException) as e:
        records.require_ready()
    assert e.value.status_code == 503


def test_write_failure_is_swallowed(monkeypatch):
    monkeypatch.setattr(supabase, "get_rows", lambda t, p: [])

    def fail():
        raise supabase.SupabaseError("boom")
    assert records.write(fail) is None
