from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional
from datetime import datetime
from ..models.db_project import ProjectStatus # Import the enum

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    link: HttpUrl # Validate URL
    image_url: Optional[HttpUrl] = None # Validate URL

    @field_validator('image_url', mode='before')
    @classmethod
    def empty_str_to_none(cls, v: str) -> Optional[str]:
        if isinstance(v, str) and v.strip() == "":
            return None # Convert empty string to None before HttpUrl validation
        return v

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    title: Optional[str] = None
    link: Optional[HttpUrl] = None
    status: Optional[ProjectStatus] = None # Allow admin to manually set status if needed

class Project(ProjectBase): # For responses
    id: int
    owner_id: int
    status: ProjectStatus
    last_checked: datetime

    class Config:
        from_attributes = True # Pydantic V2 (was orm_mode = True in V1)