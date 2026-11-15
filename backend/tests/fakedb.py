import uuid
from collections import defaultdict
from datetime import datetime, timezone
from itertools import count

from backend.core import supabase

DEFAULTS = {
    "admin_users": {"status": "pending", "last_sign_in_at": None},
    "orders": {"stage": "new", "payment_status": "pending", "needs_review": False},
    "quote_sessions": {"quote_count": 0, "handled": False, "order_id": None, "upload_id": None},
}
RESERVED = {"select", "order", "limit", "offset", "or"}


def _fmt(v) -> str:
    return str(v).lower() if isinstance(v, bool) else str(v)


def _cmp(a, b):
    try:
        return datetime.fromisoformat(str(a).replace("Z", "+00:00")), datetime.fromisoformat(str(b))
    except ValueError:
        return str(a), str(b)


def _ok(r: dict, key: str, cond: str) -> bool:
    op, _, val = cond.partition(".")
    v = r.get(key)
    if op == "eq":
        return v is not None and _fmt(v) == val
    if op == "neq":
        return _fmt(v) != val
    if op == "is":
        return v is {"null": None, "true": True, "false": False}[val]
    if op == "in":
        return _fmt(v) in val.strip("()").split(",")
    if op == "ilike":
        return val.strip("*").lower() in str(v or "").lower()
    if v is None:
        return False
    a, b = _cmp(v, val)
    return {"lt": a < b, "lte": a <= b, "gt": a > b, "gte": a >= b}[op]


class FakeDB:
    """In-memory PostgREST stand-in behind the core.supabase helpers."""

    def __init__(self):
        self.tables = defaultdict(list)
        self.missing: set[str] = set()
        self.no_role = False
        self.ids = count(1)

    def _check(self, t: str, data: dict | None = None):
        if t in self.missing:
            raise supabase.SupabaseError('{"code":"PGRST205","message":"Could not find the table"}')
        if self.no_role and t == "admin_users" and data and "role" in data:
            raise supabase.SupabaseError('{"code":"PGRST204","message":"Could not find the \'role\' column"}')

    def match(self, t: str, params: dict) -> list[dict]:
        self._check(t)
        rows = [r for r in self.tables[t] if all(_ok(r, k, str(v)) for k, v in params.items() if k not in RESERVED)]
        if params.get("or"):
            terms = [x.split(".", 1) for x in params["or"].strip("()").split(",")]
            rows = [r for r in rows if any(_ok(r, k, c) for k, c in terms)]
        if params.get("order"):
            col, _, way = params["order"].split(",")[0].partition(".")
            rows.sort(key=lambda r: str(r.get(col) or ""), reverse=way == "desc")
        return rows

    def project(self, rows: list[dict], params: dict | None) -> list[dict]:
        sel = (params or {}).get("select", "*")
        return [dict(r) if sel == "*" else {k: r.get(k) for k in sel.split(",")} for r in rows]

    def get_rows(self, t, params):
        rows = self.match(t, params)
        return self.project(rows[: int(params["limit"])] if "limit" in params else rows, params)

    def get_page(self, t, params, limit, offset=0):
        rows = self.match(t, params)
        return self.project(rows[offset: offset + limit], params), len(rows)

    def insert(self, t, new, params=None):
        out = []
        for r in new:
            self._check(t, r)
            if t == "admin_users" and any(x["email"] == r["email"] for x in self.tables[t]):
                raise supabase.SupabaseError('{"code":"23505"}')
            row = {"id": next(self.ids) if t == "activity_log" else str(uuid.uuid4()),
                   "created_at": datetime.now(timezone.utc).isoformat(), **DEFAULTS.get(t, {}), **r}
            self.tables[t].append(row)
            out.append(row)
        return self.project(out, params)

    def upsert(self, t, new):
        out = []
        for r in new:
            hit = next((x for x in self.match(t, {}) if x["id"] == r.get("id")), None)
            if hit:
                hit.update(r)
                out.append(dict(hit))
            else:
                out += self.insert(t, [r])
        return out

    def patch(self, t, params, data):
        self._check(t, data)
        hits = self.match(t, params)
        for r in hits:
            r.update(data)
        return self.project(hits, params)

    def delete(self, t, params):
        for r in self.match(t, params):
            self.tables[t].remove(r)

    def install(self, monkeypatch):
        for name, fn in {"get_rows": self.get_rows, "get_page": self.get_page, "insert_rows": self.insert,
                         "upsert_rows": self.upsert, "patch_rows": self.patch, "delete_rows": self.delete}.items():
            monkeypatch.setattr(supabase, name, fn)
        return self
