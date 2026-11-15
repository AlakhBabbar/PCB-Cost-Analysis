import logging
import time

from backend.core import supabase
from backend.core.settings import settings
from backend.models.pricing import PricingConfig
from backend.services.pricing.defaults import default_config
from backend.services.pricing.legacy import starting_config
from backend.services.pricing.rows import TABLES, rows_to_config

log = logging.getLogger(__name__)
TTL = 60
SETUP = "Run supabase/migrations/002_pricing_v2.sql in the Supabase SQL editor"
MISSING = ("PGRST202", "PGRST205", "42P01", "42883", "Could not find")
_cache: tuple[float, PricingConfig, str | None, bool] | None = None


class ConfigUnavailable(Exception):
    pass


def _rows() -> dict[str, list[dict]]:
    return {t: supabase.get_rows(t, {"select": "*", **order}) for t, order in TABLES.items()}


def _fetch(old) -> tuple[float, PricingConfig, str | None, bool]:
    try:
        rows = _rows()
        if not rows["price_settings"]:  # tables exist but are empty: first run after setup
            _rpc("save_pricing", {"cfg": starting_config().model_dump(mode="json"), "admin_id": "",
                                  "admin_name": "Setup", "note": "Starting prices"})
            rows = _rows()
        last = supabase.get_rows("price_versions", {"select": "created_at", "order": "id.desc", "limit": 1})
        return time.monotonic(), rows_to_config(rows), last[0]["created_at"] if last else None, True
    except Exception as exc:  # tables missing, network, bad rows: keep the last good config, else defaults
        log.warning("pricing tables unavailable: %s", str(exc)[:200])
        if old and old[3]:
            return time.monotonic(), *old[1:]
        return time.monotonic(), default_config(), None, False


def load_config() -> tuple[PricingConfig, str | None, bool]:
    global _cache
    if _cache is None or time.monotonic() - _cache[0] > TTL:
        _cache = _fetch(_cache)
    return _cache[1], _cache[2], _cache[3]


def get_config() -> PricingConfig:
    return load_config()[0]


def _rpc(fn: str, args: dict):
    try:
        return supabase._send("POST", f"{settings.supabase_url}/rest/v1/rpc/{fn}", json=args).json()
    except supabase.SupabaseError as exc:
        if any(m in str(exc) for m in MISSING):
            raise ConfigUnavailable(SETUP) from exc
        raise


def save_config(cfg: PricingConfig, admin: dict, note: str = "") -> tuple[PricingConfig, str | None, bool]:
    global _cache
    _rpc("save_pricing", {"cfg": cfg.model_dump(mode="json"), "admin_id": str(admin.get("id") or ""),
                          "admin_name": admin.get("name") or "", "note": note or ""})
    _cache = None
    return load_config()


def list_versions(limit: int = 50) -> list[dict]:
    try:
        rows = supabase.get_rows("price_versions", {"select": "id,created_at,admin_name,note", "order": "id.desc", "limit": limit})
    except supabase.SupabaseError:
        return []
    return [{"id": r["id"], "createdAt": r["created_at"], "adminName": r["admin_name"], "note": r["note"]} for r in rows]


def get_version(version_id: int) -> dict | None:
    try:
        rows = supabase.get_rows("price_versions", {"select": "snapshot", "id": f"eq.{version_id}"})
    except supabase.SupabaseError as exc:
        raise ConfigUnavailable(SETUP) from exc
    return rows[0]["snapshot"] if rows else None
