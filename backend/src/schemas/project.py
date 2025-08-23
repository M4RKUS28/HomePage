from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional
from datetime import datetime
from ..models.db_project import ProjectStatus # Import the enum

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    link: HttpUrl # Validate URL
    image: Optional[str] = None # Validate URL
    position: Optional[int] = 0  # For ordering projects

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    title: Optional[str] = None
    link: Optional[HttpUrl] = None
    status: Optional[ProjectStatus] = None # Allow admin to manually set status if needed
    position: Optional[int] = None  # Allow updating position

class Project(ProjectBase): # For responses
    id: int
    owner_id: int
    status: ProjectStatus
    last_checked: datetime
    position: Optional[int] = 0  # Include position in responses

    class Config:
        from_attributes = True # Pydantic V2 (was orm_mode = True in V1)