"""Pydantic schemas for Project endpoints."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator

from ...db.models.project import ProjectStatus


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------

def _require_http_url(value: Optional[str]) -> Optional[str]:
    if value is None or not value.strip():
        return None
    value = value.strip()
    if not value.lower().startswith(("http://", "https://")):
        raise ValueError("URL must start with http:// or https://")
    return value


class ProjectCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    link: HttpUrl
    github_link: Optional[str] = Field(default=None, max_length=512)
    position: Optional[int] = 0
    language: str = Field(default="en", max_length=10)
    health_check_urls: Optional[List[str]] = []
    translation_group_id: Optional[int] = None

    @field_validator("github_link")
    @classmethod
    def _validate_github_link(cls, v: Optional[str]) -> Optional[str]:
        return _require_http_url(v)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    link: Optional[HttpUrl] = None
    github_link: Optional[str] = Field(default=None, max_length=512)
    position: Optional[int] = None
    status: Optional[ProjectStatus] = None
    language: Optional[str] = Field(default=None, max_length=10)
    health_check_urls: Optional[List[str]] = None
    image_object_name: Optional[str] = Field(default=None, max_length=512)
    image_external_url: Optional[str] = Field(default=None, max_length=2048)

    @field_validator("github_link")
    @classmethod
    def _validate_github_link(cls, v: Optional[str]) -> Optional[str]:
        return _require_http_url(v)


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

class ProjectRead(BaseModel):
    """Full project detail (includes image URL)."""
    id: int
    title: str
    description: Optional[str] = None
    link: str
    github_link: Optional[str] = None
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
    github_link: Optional[str] = None
    status: ProjectStatus
    last_checked: Optional[datetime] = None
    position: int = 0
    language: str = "en"
    has_changes: bool = False
    translation_group_id: Optional[int] = None
    owner_id: int
    health_check_urls: Optional[List[str]] = []

    model_config = {"from_attributes": True}
