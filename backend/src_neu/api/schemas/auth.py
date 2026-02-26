"""Pydantic schemas for the internal auth endpoints (NextJS → FastAPI).

These endpoints return **user data only** - no JWT.
NextJS signs its own short-lived HMAC-JWT per request.
"""

from pydantic import BaseModel, EmailStr, Field

from .user import UserRead


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Credentials sent by NextJS API route to verify a user."""
    username: str
    password: str


class RegisterRequest(BaseModel):
    """Payload sent by NextJS API route to create a new user."""
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=3)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class InternalUserResponse(BaseModel):
    """Returned to NextJS after successful login / registration.

    Contains only user data - **no token**.  NextJS manages sessions
    and signs its own short-lived JWT for every backend call.
    """
    user: UserRead
