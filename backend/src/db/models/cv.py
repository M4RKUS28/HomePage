"""CV (Curriculum Vitae) ORM model - stores structured JSON data."""

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base


class CV(Base):
    __tablename__ = "cv_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    language: Mapped[str] = mapped_column(String(10), default="en", server_default="en")
    # Flexible JSON blob storing the full CV structure
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    # Translation tracking: True when content was manually edited and needs translation
    has_changes: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    owner: Mapped["User"] = relationship(back_populates="cv_data", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CV id={self.id} owner_id={self.owner_id}>"
