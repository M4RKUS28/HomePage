"""Message endpoints."""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.dependencies import get_current_active_user, get_current_admin_user, get_db
from ...db.models.user import User
from ...services import message as message_service
from ..schemas.message import MessageCreate, MessageRead

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def create_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    msg = await message_service.create_message(
        db,
        sender_id=current_user.id,
        sender_username=current_user.username,
        content=data.content,
    )
    return msg


@router.get("/", response_model=List[MessageRead], dependencies=[Depends(get_current_admin_user)])
async def list_messages(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    return await message_service.list_messages(db, skip=skip, limit=limit)


@router.put("/{message_id}/read", response_model=MessageRead)
async def mark_as_read(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return await message_service.mark_message_read(db, message_id)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    await message_service.delete_message(db, message_id)
