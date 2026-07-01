"""
Presigned URL endpoints for direct MinIO uploads & downloads.

Flow:
1. Client calls POST /storage/upload-url with desired category + filename
2. Backend returns a presigned PUT URL + the object_name
3. Client PUTs the file directly to MinIO
4. Client calls a domain endpoint (e.g. PUT /projects/{id}) with the object_name
   to persist the reference in the database
"""

from fastapi import APIRouter, Depends, HTTPException, status

from ...core.dependencies import get_current_active_user, get_current_admin_user
from ...db.minio import get_minio
from ...db.models.user import User
from ..schemas.storage import (
    PresignedDownloadResponse,
    PresignedUploadRequest,
    PresignedUploadResponse,
)

router = APIRouter(prefix="/storage", tags=["storage"])

# Object prefixes that hold publicly displayed assets. These are shown on the
# public site (avatars, project cover images), so any caller may download them.
PUBLIC_PREFIXES = ("avatars/", "projects/")

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


def _can_access_object(object_name: str, user: User) -> bool:
    """
    Authorisation for downloading a MinIO object.

    Rules:
    * Public assets (``avatars/``, ``projects/``) are readable by any caller.
    * Admins may read everything.
    * Owner-scoped assets (``cv/<user_id>/...``, ``misc/<user_id>/...``) are
      readable only by the owning user.
    * Anything else is denied for non-admins (fail closed).
    """
    if object_name.startswith(PUBLIC_PREFIXES):
        return True
    if user.is_admin:
        return True
    parts = object_name.split("/")
    if len(parts) >= 2 and parts[0] in OWNER_SCOPED_PREFIXES:
        try:
            owner_id = int(parts[1])
        except ValueError:
            return False
        return owner_id == user.id
    return False


@router.post("/upload-url", response_model=PresignedUploadResponse)
async def get_upload_url(
    req: PresignedUploadRequest,
    current_user: User = Depends(get_current_admin_user),
):
    """Generate a presigned PUT URL for direct client → MinIO upload."""
    minio = get_minio()
    object_name = _build_object_name(req.category, req.resource_id, req.filename, current_user.id)
    url = minio.presigned_put_url(object_name)
    return PresignedUploadResponse(
        upload_url=url,
        object_name=object_name,
        expires_in=minio._expiry,
    )


@router.get("/download-url/{object_name:path}", response_model=PresignedDownloadResponse)
async def get_download_url(
    object_name: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate a presigned GET URL for direct MinIO → client download.

    Private objects (e.g. uploaded CVs under ``cv/<user_id>/``) are only
    accessible to their owner or an admin; public assets like avatars and
    project images are accessible to any authenticated caller.
    """
    if not _can_access_object(object_name, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to access this object",
        )
    minio = get_minio()
    url = minio.presigned_get_url(object_name)
    return PresignedDownloadResponse(
        download_url=url,
        expires_in=minio._expiry,
    )
