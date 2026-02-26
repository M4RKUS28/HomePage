import io
import logging
from minio import Minio
from minio.error import S3Error

from ..config.settings import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MINIO_SECURE,
)

logger = logging.getLogger(__name__)


def get_minio_client() -> Minio:
    return Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE,
    )


def ensure_bucket(client: Minio, bucket: str) -> None:
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
            logger.info("Created MinIO bucket: %s", bucket)
    except S3Error as e:
        logger.error("MinIO bucket error: %s", e)
        raise


def upload_avatar(file_data: bytes, user_id: int, content_type: str) -> str:
    """Upload a profile image to MinIO and return the object name."""
    ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
    object_name = f"avatars/{user_id}.{ext}"
    client = get_minio_client()
    ensure_bucket(client, MINIO_BUCKET)
    client.put_object(
        MINIO_BUCKET,
        object_name,
        io.BytesIO(file_data),
        length=len(file_data),
        content_type=content_type,
    )
    return object_name


def get_avatar_stream(object_name: str):
    """Return the raw MinIO response for streaming."""
    client = get_minio_client()
    return client.get_object(MINIO_BUCKET, object_name)


def delete_avatar(object_name: str) -> None:
    """Delete an avatar from MinIO (best-effort, ignores missing objects)."""
    try:
        client = get_minio_client()
        client.remove_object(MINIO_BUCKET, object_name)
    except S3Error as e:
        logger.warning("Could not delete avatar %s from MinIO: %s", object_name, e)
