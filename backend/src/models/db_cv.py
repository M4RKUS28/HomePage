# backend/src/models/db_cv.py
from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..db.database import Base

class CV(Base):
    __tablename__ = "cv_data"

    id = Column(Integer, primary_key=True, index=True)
    # Store the CV data as JSON
    data = Column(JSON, nullable=False)
    # Link to the owner user (there's only one CV per site, but for future expansion)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="cv_data")

class SiteConfig(Base):
    __tablename__ = "site_config"
    
    id = Column(Integer, primary_key=True, index=True)
    header_text = Column(String(100), nullable=False, default="M4RKUS28")
    profile_name = Column(String(100), nullable=False, default="Markus")
    profile_title = Column(String(255), nullable=False, default="A Creative Full Stack Developer & Tech Enthusiast")
    profile_image = Column(String(255), nullable=True)
    show_register_callout = Column(Boolean, default=True)
    
    # Store social links as JSON
    social_links = Column(JSON, nullable=True)
    # Link to the owner user
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="site_config")