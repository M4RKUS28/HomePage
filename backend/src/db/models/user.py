"""User ORM model."""

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    # MinIO object name (e.g. "avatars/42.webp"), NOT a base64 blob
    avatar_object_name: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Relationships
    projects: Mapped[list["Project"]] = relationship(back_populates="owner", lazy="selectin")
    sent_messages: Mapped[list["Message"]] = relationship(back_populates="sender", lazy="selectin")
    cv_data: Mapped[list["CV"]] = relationship(back_populates="owner", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"
