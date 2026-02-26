"""Pydantic schemas for Message endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class MessageRead(BaseModel):
    id: int
    sender_id: int
    content: str
    timestamp: Optional[datetime] = None
    is_read: bool
    sender_username: Optional[str] = None

    model_config = {"from_attributes": True}
