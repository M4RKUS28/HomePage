"""Pydantic schemas for internal service-token (NextJS → FastAPI)."""

from typing import Optional

from pydantic import BaseModel


class TokenPayload(BaseModel):
    """Decoded JWT payload from the internal service token."""
    sub: str  # username
    user_id: int
    is_admin: bool = False
    exp: Optional[int] = None
