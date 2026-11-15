import httpx

from backend.core.settings import settings


class SupabaseError(Exception):
    pass


def _send(method: str, url: str, **kw) -> httpx.Response:
    key = settings.supabase_secret_key
    headers = {"apikey": key, "Authorization": f"Bearer {key}", **kw.pop("headers", {})}
    timeout = kw.pop("timeout", 10)
    try:
        r = httpx.request(method, url, headers=headers, timeout=timeout, **kw)
    except httpx.HTTPError as exc:
        raise SupabaseError(str(exc)) from exc
    if not r.is_success:
        raise SupabaseError(r.text)
    return r


def _url(table: str) -> str:
    return f"{settings.supabase_url}/rest/v1/{table}"


def _request(method: str, table: str, **kw) -> list[dict]:
    return _send(method, _url(table), **kw).json()


def get_rows(table: str, params: dict) -> list[dict]:
    return _request("GET", table, params=params)


def get_page(table: str, params: dict, limit: int, offset: int = 0) -> tuple[list[dict], int]:
    """Rows plus the exact total from Content-Range."""
    r = _send("GET", _url(table), params={**params, "limit": limit, "offset": offset}, headers={"Prefer": "count=exact"})
    total = r.headers.get("content-range", "*/0").rpartition("/")[2]
    return r.json(), int(total) if total.isdigit() else 0


def count(table: str, params: dict) -> int:
    return get_page(table, {**params, "select": "id"}, 0)[1]


def insert_rows(table: str, rows: list[dict], params: dict | None = None) -> list[dict]:
    return _request("POST", table, params=params, json=rows, headers={"Prefer": "return=representation"})


def upsert_rows(table: str, rows: list[dict]) -> list[dict]:
    return _request("POST", table, json=rows, headers={"Prefer": "resolution=merge-duplicates,return=representation"})


def patch_rows(table: str, params: dict, data: dict) -> list[dict]:
    return _request("PATCH", table, params=params, json=data, headers={"Prefer": "return=representation"})


def delete_rows(table: str, params: dict) -> None:
    _send("DELETE", _url(table), params=params)


def rpc(fn: str, args: dict):
    return _send("POST", f"{settings.supabase_url}/rest/v1/rpc/{fn}", json=args).json()


# Storage

def _storage(path: str) -> str:
    return f"{settings.supabase_url}/storage/v1/{path}"


def ensure_bucket(bucket: str) -> None:
    """A private bucket that refuses files over the upload limit, created or updated."""
    rules = {"public": False, "file_size_limit": settings.max_upload_mb * 1024 * 1024}
    try:
        _send("POST", _storage("bucket"), json={"id": bucket, "name": bucket, **rules})
    except SupabaseError as exc:
        if "already exists" not in str(exc).lower() and "duplicate" not in str(exc).lower():
            raise
        _send("PUT", _storage(f"bucket/{bucket}"), json=rules)


def upload_file(bucket: str, path: str, data: bytes, content_type: str) -> None:
    _send("POST", _storage(f"object/{bucket}/{path}"), content=data, timeout=120,
          headers={"Content-Type": content_type, "x-upsert": "true"})


def signed_upload_url(bucket: str, path: str) -> str:
    """A one time link the browser can PUT one file to."""
    r = _send("POST", _storage(f"object/upload/sign/{bucket}/{path}")).json()
    return _storage(r["url"].lstrip("/"))


def download_file(bucket: str, path: str) -> bytes:
    return _send("GET", _storage(f"object/{bucket}/{path}"), timeout=120).content


def delete_file(bucket: str, path: str) -> None:
    _send("DELETE", _storage(f"object/{bucket}/{path}"))


def signed_url(bucket: str, path: str, expires_in: int) -> str:
    r = _send("POST", _storage(f"object/sign/{bucket}/{path}"), json={"expiresIn": expires_in}).json()
    return _storage(r["signedURL"].lstrip("/"))
