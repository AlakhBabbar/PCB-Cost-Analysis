import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_hits: dict[tuple[str, str], deque] = defaultdict(deque)


def limit(bucket: str, n: int, per: int):
    """Dependency: at most n calls per `per` seconds for each client IP."""
    def dep(request: Request) -> None:
        now = time.monotonic()
        if len(_hits) > 10_000:
            for k in [k for k, q in _hits.items() if not q or q[-1] <= now - 3600]:
                del _hits[k]
        q = _hits[(bucket, request.client.host if request.client else "?")]
        while q and q[0] <= now - per:
            q.popleft()
        if len(q) >= n:
            raise HTTPException(429, "Too many requests. Please wait a minute.")
        q.append(now)
    return dep
