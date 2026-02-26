from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from ..models.db_project import ProjectStatus


class ProjectBase(BaseModel):
    """Shared fields for write operations (create / update)."""
    title: str
    description: Optional[str] = None
    link: HttpUrl
    position: Optional[int] = 0
    health_check_urls: Optional[List[str]] = []


class ProjectCreate(ProjectBase):
    """All fields required for creation; image is uploaded separately."""
    pass


class ProjectUpdate(ProjectBase):
    """All fields optional for partial updates."""
    title: Optional[str] = None
    link: Optional[HttpUrl] = None
    status: Optional[ProjectStatus] = None
    position: Optional[int] = None
    health_check_urls: Optional[List[str]] = None


class Project(ProjectBase):
    """Full project response - includes image."""
    id: int
    owner_id: int
    status: ProjectStatus
    last_checked: datetime
    image: Optional[str] = None  # returned in the full detail view

    class Config:
        from_attributes = True


class ProjectList(BaseModel):
    """Project metadata without image - for fast list endpoint."""
    id: int
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    status: ProjectStatus
    last_checked: datetime
    position: Optional[int] = 0
    owner_id: int
    health_check_urls: Optional[List[str]] = []

    class Config:
        from_attributes = True


class ProjectImage(BaseModel):
    """Only the image data - for lazy loading."""
    id: int
    image: Optional[str] = None

    class Config:
        from_attributes = True
