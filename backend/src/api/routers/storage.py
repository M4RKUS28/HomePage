"""
Presigned URL endpoints for direct S3 uploads & downloads.

Flow:
1. Client calls POST /storage/upload-url with desired category + filename
2. Backend returns a presigned PUT URL + the object_name
3. Client PUTs the file directly to the object store
4. Client calls a domain endpoint (e.g. PUT /projects/{id}) with the object_name
   to persist the reference in the database
"""

import re

from fastapi import APIRouter, Depends, HTTPException, status

from ...core.dependencies import get_current_active_user, get_current_admin_user
from ...db.storage import get_storage
from ...db.models.user import User
from ..schemas.storage import (
    PresignedDownloadResponse,
    PresignedUploadRequest,
    PresignedUploadResponse,
)

router = APIRouter(prefix="/storage", tags=["storage"])

# Object prefixes that hold publicly displayed assets. These are shown on the
# public site (avatars, project cover images), so any caller may download them.
PUBLIC_PREFIXES = ("avatars", "projects")

# Object prefixes that are owner-scoped: ``<prefix>/<user_id>/<filename>``.
# Only the owning user (or an admin) may download them. Add new private
# categories here so they default to private rather than world-readable.
OWNER_SCOPED_PREFIXES = ("cv", "misc")


def _build_object_name(category: str, resource_id: int | None, filename: str, user_id: int) -> str:
    """Deterministic object naming: ``<category>/<id>/<filename>``."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    if category == "avatars":
        return f"avatars/{user_id}/avatar.{ext}"
    elif category == "projects" and resource_id:
        return f"projects/{resource_id}/cover.{ext}"
    elif category == "cv":
        return f"cv/{user_id}/{filename}"
    return f"misc/{user_id}/{filename}"


_ENCODED_SEPARATOR_OR_DOT = re.compile(r"%(2e|2f|5c)", re.IGNORECASE)


def _split_object_name(object_name: str) -> list[str] | None:
    """
    Split an object name into path segments, or return ``None`` if the name is
    not in canonical form (empty / ``.`` / ``..`` segments, backslashes,
    percent-encoded dots or separators, control characters).
    """
    if not object_name or "\\" in object_name:
        return None
    if _ENCODED_SEPARATOR_OR_DOT.search(object_name):
        return None
    if any(ord(c) < 0x20 or ord(c) == 0x7F for c in object_name):
        return None
    parts = object_name.split("/")
    if any(part in ("", ".", "..") for part in parts):
        return None
    return parts


def _can_access_object(parts: list[str], user: User) -> bool:
    """
    Authorisation for downloading an S3 object.

    Rules:
    * Public assets (``avatars/``, ``projects/``) are readable by any caller.
    * Admins may read everything.
    * Owner-scoped assets (``cv/<user_id>/...``, ``misc/<user_id>/...``) are
      readable only by the owning user.
    * Anything else is denied for non-admins (fail closed).
    """
    if len(parts) >= 2 and parts[0] in PUBLIC_PREFIXES:
        return True
    if user.is_admin:
        return True
    if len(parts) >= 3 and parts[0] in OWNER_SCOPED_PREFIXES:
        return parts[1] == str(user.id)
    return False


@router.post("/upload-url", response_model=PresignedUploadResponse)
async def get_upload_url(
    req: PresignedUploadRequest,
    current_user: User = Depends(get_current_admin_user),
):
    """Generate a presigned PUT URL for direct client → object-store upload."""
    storage = get_storage()
    object_name = _build_object_name(req.category, req.resource_id, req.filename, current_user.id)
    url = storage.presigned_put_url(object_name)
    return PresignedUploadResponse(
        upload_url=url,
        object_name=object_name,
        expires_in=storage._expiry,
    )


@router.get("/download-url/{object_name:path}", response_model=PresignedDownloadResponse)
async def get_download_url(
    object_name: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate a presigned GET URL for direct object-store → client download.

    Private objects (e.g. uploaded CVs under ``cv/<user_id>/``) are only
    accessible to their owner or an admin; public assets like avatars and
    project images are accessible to any authenticated caller.
    """
    parts = _split_object_name(object_name)
    if parts is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid object name",
        )
    if not _can_access_object(parts, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to access this object",
        )
    storage = get_storage()
    url = storage.presigned_get_url(object_name)
    return PresignedDownloadResponse(
        download_url=url,
        expires_in=storage._expiry,
    )
