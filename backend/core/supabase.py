import httpx

from backend.core.settings import settings


class SupabaseError(Exception):
    pass


def _send(method: str, url: str, **kw) -> httpx.Response:
    key = settings.supabase_secret_key
    headers = {"apikey": key, "Authorization": f"Bearer {key}", **kw.pop("headers", {})}
    try:
        r = httpx.request(method, url, headers=headers, timeout=10, **kw)
    except httpx.HTTPError as exc:
        raise SupabaseError(str(exc)) from exc
    if not r.is_success:
        raise SupabaseError(r.text)
    return r


def _request(method: str, table: str, **kw) -> list[dict]:
    return _send(method, f"{settings.supabase_url}/rest/v1/{table}", **kw).json()


def get_rows(table: str, params: dict) -> list[dict]:
    return _request("GET", table, params=params)


def insert_rows(table: str, rows: list[dict], params: dict | None = None) -> list[dict]:
    return _request("POST", table, params=params, json=rows, headers={"Prefer": "return=representation"})


def upsert_rows(table: str, rows: list[dict]) -> list[dict]:
    return _request("POST", table, json=rows, headers={"Prefer": "resolution=merge-duplicates,return=representation"})


def patch_rows(table: str, params: dict, data: dict) -> list[dict]:
    return _request("PATCH", table, params=params, json=data, headers={"Prefer": "return=representation"})


def delete_rows(table: str, params: dict) -> None:
    _send("DELETE", f"{settings.supabase_url}/rest/v1/{table}", params=params)


# ── Storage ────────────────────────────────────────────────

def _storage(path: str) -> str:
    return f"{settings.supabase_url}/storage/v1/{path}"


def ensure_bucket(bucket: str) -> None:
    """Create a private bucket if it does not exist yet."""
    try:
        _send("POST", _storage("bucket"), json={"id": bucket, "name": bucket, "public": False})
    except SupabaseError as exc:
        if "already exists" not in str(exc).lower() and "duplicate" not in str(exc).lower():
            raise


def upload_file(bucket: str, path: str, data: bytes, content_type: str) -> None:
    _send("POST", _storage(f"object/{bucket}/{path}"), content=data, headers={"Content-Type": content_type})


def signed_url(bucket: str, path: str, expires_in: int) -> str:
    r = _send("POST", _storage(f"object/sign/{bucket}/{path}"), json={"expiresIn": expires_in}).json()
    return _storage(r["signedURL"].lstrip("/"))
