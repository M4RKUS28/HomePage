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

class SiteConfig(Base):
    __tablename__ = "site_config"
    
    id = Column(Integer, primary_key=True, index=True)
    header_text = Column(String(100), nullable=False, default="M4RKUS28")
    profile_name = Column(String(100), nullable=False, default="Markus")
    profile_title = Column(String(255), nullable=False, default="A Creative Full Stack Developer & Tech Enthusiast")
    # Change to store full base64 image data, Text type allows for large strings
    profile_image = Column(LONGTEXT, nullable=True)
    show_register_callout = Column(Boolean, default=True)
    
    # Store social links as JSON
    social_links = Column(JSON, nullable=True)
    # Link to the owner user
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="site_config")