"""
Presigned URL endpoints for direct MinIO uploads & downloads.

Flow:
1. Client calls POST /storage/upload-url with desired category + filename
2. Backend returns a presigned PUT URL + the object_name
3. Client PUTs the file directly to MinIO
4. Client calls a domain endpoint (e.g. PUT /projects/{id}) with the object_name
   to persist the reference in the database
"""

from fastapi import APIRouter, Depends

from ...core.dependencies import get_current_active_user, get_current_admin_user
from ...db.minio import get_minio
from ...db.models.user import User
from ..schemas.storage import (
    PresignedDownloadResponse,
    PresignedUploadRequest,
    PresignedUploadResponse,
)

router = APIRouter(prefix="/storage", tags=["storage"])


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
    """Generate a presigned GET URL for direct MinIO → client download."""
    minio = get_minio()
    url = minio.presigned_get_url(object_name)
    return PresignedDownloadResponse(
        download_url=url,
        expires_in=minio._expiry,
    )
