from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..schemas import message as message_schemas
from ..models import db_message as message_model
from ..models import db_user as user_model
from ..utils import auth
from ..db.database import get_db

router = APIRouter(
    prefix="/messages",
    tags=["messages"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=message_schemas.Message, status_code=status.HTTP_201_CREATED)
async def create_message(
    message: message_schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_active_user) # Any active user can send
):
    db_message = message_model.Message(**message.model_dump(), sender_id=current_user.id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.get("/", response_model=List[message_schemas.Message])
async def read_messages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user) # Only admin can read all
):
    # Optionally, join with User table to get sender username if needed
    # messages = db.query(message_model.Message).join(user_model.User).order_by(message_model.Message.timestamp.desc()).offset(skip).limit(limit).all()
    messages = db.query(message_model.Message).order_by(message_model.Message.timestamp.desc()).offset(skip).limit(limit).all()
    return messages

@router.put("/{message_id}/read", response_model=message_schemas.Message)
async def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    db_message = db.query(message_model.Message).filter(message_model.Message.id == message_id).first()
    if db_message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    db_message.is_read = True
    db.commit()
    db.refresh(db_message)
    return db_message

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    db_message = db.query(message_model.Message).filter(message_model.Message.id == message_id).first()
    if db_message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    db.delete(db_message)
    db.commit()
    return None