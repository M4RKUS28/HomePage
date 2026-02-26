"""
Message service – business logic for message management.
"""

import logging

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.crud import message as message_crud
from ..db.models.message import Message
from .email import notify_new_message

logger = logging.getLogger(__name__)


async def list_messages(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> list[dict]:
    """Return messages with sender username attached."""
    rows = await message_crud.get_messages(db, skip=skip, limit=limit)
    result = []
    for msg, username in rows:
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "timestamp": msg.timestamp,
            "is_read": msg.is_read,
            "sender_username": username,
        })
    return result


async def create_message(
    db: AsyncSession,
    *,
    sender_id: int,
    sender_username: str,
    content: str,
) -> Message:
    """Create a message and notify admin via email (fire-and-forget)."""
    msg = await message_crud.create_message(db, sender_id=sender_id, content=content)

    # Non-blocking email notification
    try:
        await notify_new_message(content, sender_username)
    except Exception as exc:
        logger.error("Email notification failed: %s", exc)

    return msg


async def mark_message_read(db: AsyncSession, message_id: int) -> Message:
    msg = await message_crud.get_message_by_id(db, message_id)
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return await message_crud.mark_as_read(db, msg)


async def delete_message(db: AsyncSession, message_id: int) -> None:
    msg = await message_crud.get_message_by_id(db, message_id)
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    await message_crud.delete_message(db, msg)
