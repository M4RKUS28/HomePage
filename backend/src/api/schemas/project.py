"""Pydantic schemas for Project endpoints."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl

from ...db.models.project import ProjectStatus


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------

class ProjectCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    link: HttpUrl
    position: Optional[int] = 0
    language: str = Field(default="en", max_length=10)
    health_check_urls: Optional[List[str]] = []
    translation_group_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    link: Optional[HttpUrl] = None
    position: Optional[int] = None
    status: Optional[ProjectStatus] = None
    language: Optional[str] = Field(default=None, max_length=10)
    health_check_urls: Optional[List[str]] = None
    image_object_name: Optional[str] = Field(default=None, max_length=512)
    image_external_url: Optional[str] = Field(default=None, max_length=2048)


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

class ProjectRead(BaseModel):
    """Full project detail (includes image URL)."""
    id: int
    title: str
    description: Optional[str] = None
    link: str
    image_url: Optional[str] = None  # presigned download URL (resolved in service)
    image_external_url: Optional[str] = None
    status: ProjectStatus
    last_checked: Optional[datetime] = None
    position: int = 0
    language: str = "en"
    has_changes: bool = False
    translation_group_id: Optional[int] = None
    owner_id: int
    health_check_urls: Optional[List[str]] = []

    model_config = {"from_attributes": True}


class ProjectGithubImportResponse(BaseModel):
    """Result of AI-assisted GitHub README import (not yet persisted)."""
    title: str
    description: str
    github_link: str
    image_url: str = ""
    website_url: str = ""


class ProjectListItem(BaseModel):
    """Lightweight list representation (no image)."""
    id: int
    title: str
    description: Optional[str] = None
    link: str
    status: ProjectStatus
    last_checked: Optional[datetime] = None
    position: int = 0
    language: str = "en"
    has_changes: bool = False
    translation_group_id: Optional[int] = None
    owner_id: int
    health_check_urls: Optional[List[str]] = []

    model_config = {"from_attributes": True}
