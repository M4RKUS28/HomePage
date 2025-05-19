# backend/src/models/db_cv.py
from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..db.database import Base
from sqlalchemy.dialects.mysql import LONGTEXT


class CV(Base):
    __tablename__ = "cv_data"

    id = Column(Integer, primary_key=True, index=True)
    # Store the CV data as JSON - this includes project images within the data
    data = Column(JSON, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="cv_data")