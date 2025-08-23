from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from sqlalchemy.dialects.mysql import LONGTEXT  # For storing large base64 images

from ..db.database import Base

class ProjectStatus(str, enum.Enum):
    UP = "up"
    DOWN = "down"
    UNKNOWN = "unknown"
    CHECKING = "checking"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    link = Column(String(255), nullable=False)
    image = Column(LONGTEXT, nullable=True) # Or store image blobs if preferred
    status = Column(SQLAlchemyEnum(ProjectStatus), default=ProjectStatus.UNKNOWN)
    last_checked = Column(DateTime(timezone=True), server_default=func.now())
    position = Column(Integer, nullable=True, default=0)  # For ordering projects
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User")