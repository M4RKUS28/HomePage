"""Pydantic schemas for presigned URL / file-storage endpoints."""

from typing import Optional

from pydantic import BaseModel, Field


class PresignedUploadRequest(BaseModel):
    """Client requests a presigned URL to upload a file."""
    filename: str = Field(..., description="Original filename (used to derive content-type & extension)")
    content_type: Optional[str] = Field(None, description="MIME type override")
    # Where to store: "avatars", "projects", "cv"
    category: str = Field(..., pattern=r"^(avatars|projects|cv)$")
    # For project images: which project does it belong to?
    resource_id: Optional[int] = None


class PresignedUploadResponse(BaseModel):
    """Returned to the client – they PUT to this URL directly."""
    upload_url: str
    object_name: str  # stored as reference in the DB
    expires_in: int  # seconds


class PresignedDownloadResponse(BaseModel):
    """Presigned GET URL for downloading / viewing a file."""
    download_url: str
    expires_in: int
