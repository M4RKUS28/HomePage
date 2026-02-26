from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..schemas import message as message_schemas
from ..models import db_message as message_model
from ..models import db_user as user_model
from ..utils import auth
from ..db.database import get_db
from ..utils.email import notify_new_message


router = APIRouter(
    prefix="/messages",
    tags=["messages"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=message_schemas.Message, status_code=status.HTTP_201_CREATED)
async def create_message(
    message: message_schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_active_user)
):
    db_message = message_model.Message(**message.model_dump(), sender_id=current_user.id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Send email notification
    notify_new_message(message.content, current_user.username)
    
    return db_message

@router.get("/", response_model=List[message_schemas.Message])
async def read_messages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    # Join with User table to get sender username
    messages = db.query(message_model.Message, user_model.User.username)\
        .join(user_model.User, message_model.Message.sender_id == user_model.User.id)\
        .order_by(message_model.Message.timestamp.desc())\
        .offset(skip).limit(limit).all()
    
    # Format the results to include username
    result = []
    for message, username in messages:
        message_dict = {
            "id": message.id,
            "sender_id": message.sender_id,
            "content": message.content,
            "timestamp": message.timestamp,
            "is_read": message.is_read,
            "sender_username": username
        }
        result.append(message_dict)
    
    return result


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