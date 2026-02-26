"""Message ORM model."""

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from ..base import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[str | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    sender: Mapped["User"] = relationship(back_populates="sent_messages", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Message id={self.id} sender_id={self.sender_id}>"
