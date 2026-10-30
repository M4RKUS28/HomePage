"""
S3-compatible object-storage client (Garage).

Uses the MinIO Python SDK as a generic S3 client; the storage
backend is Garage (single-node, provisioned externally).

Provides:
* Presigned upload URLs  (client uploads directly to Garage)
* Presigned download URLs (client downloads directly from Garage)
* Server-side upload / delete helpers for small files (e.g. avatars < 5 MB)
* Bucket initialisation

The MinIO Python SDK (used as a generic S3 client) is synchronous - presigned URL generation is CPU-bound
and fast, so running it synchronously in the async context is acceptable.
For heavy I/O (streaming large objects) use presigned URLs instead.
"""

import io
import logging
from datetime import timedelta
from typing import Optional
from urllib.parse import urlparse, urlunparse

from minio import Minio
from minio.error import S3Error

from ..core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


class S3Storage:
    """Wrapper around the S3 client with convenience methods."""

    def __init__(self) -> None:
        cfg = settings.s3
        self._client = Minio(
            cfg.endpoint,
            access_key=cfg.access_key,
            secret_key=cfg.secret_key,
            secure=cfg.secure,
            region=cfg.region,  # explicit region; Garage has no region lookup
        )
        self._bucket = cfg.bucket
        self._expiry = cfg.presigned_expiry
        self._public_url = cfg.public_url

    # ------------------------------------------------------------------
    # Bucket management
    # ------------------------------------------------------------------

    def ensure_bucket(self) -> None:
        """Verify the default bucket exists; it is provisioned by Garage."""
        try:
            if not self._client.bucket_exists(self._bucket):
                raise RuntimeError(
                    f"S3 bucket '{self._bucket}' does not exist; "
                    "provision it in Garage (GARAGE_DEFAULT_BUCKET / "
                    "garage bucket create) before starting the backend"
                )
        except S3Error as exc:
            logger.error("S3 bucket error: %s", exc)
            raise

    # ------------------------------------------------------------------
    # Presigned URLs
    # ------------------------------------------------------------------

    def _rewrite_url(self, url: str) -> str:
        """
        If ``S3_PUBLIC_URL`` is configured, replace the internal
        host:port with the public one so the browser can reach the
        object store through the nginx ``/storage/`` proxy. The request
        stays signed for the internal host (``garage:3900``), which is
        what the proxy forwards as ``Host``.
        """
        if not self._public_url:
            return url
        parsed = urlparse(url)
        public = urlparse(self._public_url)
        
        # Merge paths if public_url has a path component (e.g., /storage)
        new_path = parsed.path
        if public.path and public.path != "/":
            new_path = f"{public.path.rstrip('/')}/{parsed.path.lstrip('/')}"
            
        return urlunparse(parsed._replace(scheme=public.scheme, netloc=public.netloc, path=new_path))

    def presigned_put_url(
        self,
        object_name: str,
        expires: Optional[int] = None,
    ) -> str:
        """
        Generate a presigned PUT URL so the client can upload directly.

        Returns the URL as a string.
        """
        url = self._client.presigned_put_object(
            self._bucket,
            object_name,
            expires=timedelta(seconds=expires or self._expiry),
        )
        return self._rewrite_url(url)

    def presigned_get_url(
        self,
        object_name: str,
        expires: Optional[int] = None,
    ) -> str:
        """
        Generate a presigned GET URL for direct downloads.
        """
        url = self._client.presigned_get_object(
            self._bucket,
            object_name,
            expires=timedelta(seconds=expires or self._expiry),
        )
        return self._rewrite_url(url)

    # ------------------------------------------------------------------
    # Server-side helpers (for small files like avatars)
    # ------------------------------------------------------------------

    def upload_file(
        self,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload bytes directly from the backend. Returns the object name."""
        self.ensure_bucket()
        self._client.put_object(
            self._bucket,
            object_name,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return object_name

    def delete_file(self, object_name: str) -> None:
        """Delete an object (best-effort, ignores missing objects)."""
        try:
            self._client.remove_object(self._bucket, object_name)
        except S3Error as exc:
            logger.warning("Could not delete %s: %s", object_name, exc)

    def file_exists(self, object_name: str) -> bool:
        """Check whether an object exists."""
        try:
            self._client.stat_object(self._bucket, object_name)
            return True
        except S3Error:
            return False


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_storage: Optional[S3Storage] = None


def get_storage() -> S3Storage:
    """Return the module-level S3Storage singleton (lazy-initialised)."""
    global _storage
    if _storage is None:
        _storage = S3Storage()
        _storage.ensure_bucket()
    return _storage
