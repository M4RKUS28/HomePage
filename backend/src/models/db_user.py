# Updated version of backend/src/models/db_user.py
from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from ..db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False) # Added for admin role

    projects = relationship("Project", back_populates="owner")
    sent_messages = relationship("Message", back_populates="sender")
    # Add relationships to the new models
    cv_data = relationship("CV", back_populates="owner")
    site_config = relationship("SiteConfig", back_populates="owner")