import uuid

from fastapi import Header


def session_id(x_session_id: str | None = Header(default=None)) -> str | None:
    """The browser's quote session id, or None when missing or not a uuid."""
    try:
        return str(uuid.UUID(x_session_id)) if x_session_id else None
    except ValueError:
        return None
