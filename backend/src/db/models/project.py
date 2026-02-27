"""Project ORM model."""

import enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from ..base import Base


class ProjectStatus(str, enum.Enum):
    UP = "up"
    DOWN = "down"
    UNKNOWN = "unknown"
    CHECKING = "checking"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    link: Mapped[str] = mapped_column(String(512), nullable=False)
    # MinIO object name (e.g. "projects/7/cover.webp") - NO base64 blobs
    image_object_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        SQLEnum(ProjectStatus, name="project_status", values_callable=lambda e: [x.value for x in e]),
        default=ProjectStatus.UNKNOWN,
    )
    last_checked: Mapped[str | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )
    language: Mapped[str] = mapped_column(String(10), default="en", server_default="en")
    # Translation tracking
    has_changes: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    translation_group_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    # Optional URLs for health checking (all must be UP for project to be UP)
    health_check_urls: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    owner: Mapped["User"] = relationship(back_populates="projects", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title!r}>"
