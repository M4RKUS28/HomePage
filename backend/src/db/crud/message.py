"""
CRUD operations for the Message model.
"""

from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.message import Message
from ..models.user import User


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

async def get_message_by_id(db: AsyncSession, message_id: int) -> Optional[Message]:
    result = await db.execute(select(Message).where(Message.id == message_id))
    return result.scalar_one_or_none()


async def get_messages(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> Sequence[tuple[Message, str]]:
    """Return messages joined with sender username, ordered by newest first."""
    stmt = (
        select(Message, User.username)
        .join(User, Message.sender_id == User.id)
        .order_by(Message.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.all()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def create_message(
    db: AsyncSession,
    *,
    sender_id: int,
    content: str,
) -> Message:
    message = Message(sender_id=sender_id, content=content)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

async def mark_as_read(db: AsyncSession, message: Message) -> Message:
    message.is_read = True
    await db.commit()
    await db.refresh(message)
    return message


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def delete_message(db: AsyncSession, message: Message) -> None:
    await db.delete(message)
    await db.commit()
