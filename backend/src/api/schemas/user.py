"""Pydantic schemas for User endpoints."""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserRead(BaseModel):
    """Public user representation returned by the API."""
    id: int
    username: str
    email: EmailStr
    is_active: bool
    is_admin: bool
    avatar_url: Optional[str] = None  # presigned download URL (resolved in service layer)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Write schemas
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    """
    Payload for creating a new user.

    NOTE: In the new architecture, user registration happens in NextJS.
    This schema is only used for the admin-seeding / internal creation path.
    """
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=3)
    is_admin: bool = False


class UserUpdate(BaseModel):
    """Partial update payload (all fields optional)."""
    username: Optional[str] = Field(default=None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=3)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
