import httpx

from backend.core.settings import settings


class WooError(Exception):
    pass


def _request(method: str, path: str, **kw) -> dict:
    url = f"{settings.wc_url.rstrip('/')}/wp-json/wc/v3/{path}"
    try:
        r = httpx.request(method, url, auth=(settings.wc_key, settings.wc_secret), timeout=30,
                          headers={"User-Agent": "PCB-Quote-App/1.0"}, **kw)
    except httpx.HTTPError as exc:
        raise WooError(f"Could not reach the store: {exc}") from exc
    if not r.is_success:
        try:
            detail = r.json().get("message", r.text)
        except ValueError:
            detail = r.text
        raise WooError(f"Store returned {r.status_code}: {detail}"[:300])
    return r.json()


def create_order(order: dict) -> dict:
    return _request("POST", "orders", json=order)


def add_order_note(order_id: int, note: str) -> dict:
    """Private note, visible to the shop admin only."""
    return _request("POST", f"orders/{order_id}/notes", json={"note": note, "customer_note": False})
