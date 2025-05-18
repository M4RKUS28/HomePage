# backend/src/schemas/cv.py (modified)
from pydantic import BaseModel, HttpUrl, validator, Field
from typing import List, Dict, Optional, Any, Union
from datetime import datetime

# Schema for CV data structure (flexible)
class CVData(BaseModel):
    summary: Optional[str] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    projectsHighlight: Optional[List[Dict[str, Any]]] = None
    awards: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[Dict[str, Any]]] = None
    volunteering: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[Dict[str, Any]]] = None
    personalInfo: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
        
# CV model for ORM
class CV(BaseModel):
    id: int
    owner_id: int
    data: CVData

    class Config:
        from_attributes = True

class CVCreate(BaseModel):
    data: CVData

class CVUpdate(BaseModel):
    data: CVData

# Image model for uploads
class ImageUpload(BaseModel):
    # Base64-encoded image data
    image_data: str
    image_type: str = "profile"  # "profile", "project", etc.
    project_id: Optional[int] = None  # For project images

# Site Config models
class SocialLink(BaseModel):
    platform: str
    url: str

class SiteConfigBase(BaseModel):
    header_text: Optional[str] = None
    profile_name: Optional[str] = None
    profile_title: Optional[str] = None
    profile_image: Optional[str] = None
    show_register_callout: Optional[bool] = None
    social_links: Optional[List[SocialLink]] = None

class SiteConfig(SiteConfigBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class SiteConfigCreate(SiteConfigBase):
    pass

class SiteConfigUpdate(SiteConfigBase):
    pass