"""Pydantic schemas for the internal auth endpoints (NextJS → FastAPI)."""

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

class AuthResponse(BaseModel):
    """Returned to NextJS after successful login / registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserRead
