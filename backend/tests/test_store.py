import time

import pytest

from backend.core import supabase
from backend.services.pricing import store
from backend.services.pricing.defaults import default_config


def table_rows(cfg) -> dict[str, list[dict]]:
    d = cfg.model_dump()
    return {
        "price_settings": [{**s, "sort_order": i} for i, s in enumerate(d["settings"])],
        "price_categories": [{k: c[k] for k in ("key", "label", "target", "multi", "help")} for c in d["categories"]],
        "price_options": [{"category": c["key"], "name": o["name"], "label": o["label"], "op": o["op"], "value": o["value"],
                           "order_fee": o["orderFee"], "note": o["note"], "enabled": o["enabled"]}
                          for c in d["categories"] for o in c["options"]],
        "price_order_types": [{"name": t["name"], "makes_board": t["makesBoard"], "assembles": t["assembles"], "enabled": t["enabled"]}
                              for t in d["orderTypes"]],
        "price_markup_tiers": [{"max_qty": t["maxQty"], "markup_pct": t["markupPct"]} for t in d["markupTiers"]],
        "price_formulas": d["formulas"],
        "price_rules": [{"id": r["id"], "message": r["message"], "expr": r["when"], "action": r["action"], "enabled": r["enabled"]}
                        for r in d["rules"]],
        "price_versions": [{"created_at": "2026-01-01T00:00:00+00:00"}],
    }


def test_offline_serves_defaults():
    assert store.get_config() == default_config()
    assert store.load_config() == (default_config(), None, False)


def test_load_from_tables(monkeypatch):
    cfg = default_config()
    cfg.settings[0].value = 12
    rows = table_rows(cfg)
    monkeypatch.setattr(supabase, "get_rows", lambda t, p: rows[t])
    assert store.load_config() == (cfg, "2026-01-01T00:00:00+00:00", True)


def test_empty_tables_serve_defaults_when_seeding_fails(monkeypatch):
    monkeypatch.setattr(supabase, "get_rows", lambda t, p: [])
    assert store.load_config()[2] is False


def test_empty_tables_are_filled_on_first_run(monkeypatch):
    saved, old = {}, {"pricing_rates": [{"key": "rent", "value": 22000}, {"key": "yieldPct", "value": 500}],
                      "pricing_policy": [{"fab_source": "inhouse"}]}

    def rpc(fn, args):
        saved.update(table_rows(type(default_config()).model_validate(args["cfg"])))

    monkeypatch.setattr(supabase, "get_rows", lambda t, p: old.get(t) or saved.get(t, []))
    monkeypatch.setattr(store, "_rpc", rpc)
    cfg, _, ready = store.load_config()
    values = {s.key: s.value for s in cfg.settings}
    assert ready and values["rent"] == 22000 and values["inhouse"] == 1 and values["yield_pct"] == 100


def test_keeps_last_good_config_when_offline(monkeypatch):
    cfg = default_config()
    cfg.settings[0].value = 12
    monkeypatch.setattr(store, "_cache", (time.monotonic() - 999, cfg, "t", True))
    assert store.load_config() == (cfg, "t", True)


class Resp:
    def json(self):
        return 7


def test_save_calls_rpc(monkeypatch):
    calls = []
    monkeypatch.setattr(supabase, "_send", lambda m, url, **kw: calls.append((m, url, kw["json"])) or Resp())
    monkeypatch.setattr(store, "_cache", (time.monotonic(), default_config(), "t", True))
    monkeypatch.setattr(store, "load_config", lambda: "reloaded")
    assert store.save_config(default_config(), {"id": "a1", "name": "Admin"}, "test") == "reloaded"
    (method, url, body), = calls
    assert method == "POST" and url.endswith("/rest/v1/rpc/save_pricing")
    assert body["admin_id"] == "a1" and body["admin_name"] == "Admin" and body["note"] == "test"
    assert body["cfg"]["settings"][0]["key"] == "min_board_mm"
    assert store._cache is None


def test_save_without_migration(monkeypatch):
    def missing(*a, **kw):
        raise supabase.SupabaseError('{"code":"PGRST202","message":"Could not find the function public.save_pricing"}')
    monkeypatch.setattr(supabase, "_send", missing)
    with pytest.raises(store.ConfigUnavailable, match="002_pricing_v2.sql"):
        store.save_config(default_config(), {"id": "a1"}, "")


def test_save_network_error_is_not_setup(monkeypatch):
    with pytest.raises(supabase.SupabaseError):
        store.save_config(default_config(), {"id": "a1"}, "")


def test_versions(monkeypatch):
    rows = [{"id": 2, "created_at": "b", "admin_name": "Admin", "note": "n"}]
    monkeypatch.setattr(supabase, "get_rows", lambda t, p: rows if p.get("order") == "id.desc" else [{"snapshot": {"x": 1}}])
    assert store.list_versions() == [{"id": 2, "createdAt": "b", "adminName": "Admin", "note": "n"}]
    assert store.get_version(2) == {"x": 1}
