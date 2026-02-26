from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase): # For responses
    id: int
    sender_id: int
    timestamp: datetime
    is_read: bool
    # You might want to include sender details here for convenience in the frontend
    sender_username: Optional[str] = None  # Add this field

    class Config:
        from_attributes = True
    