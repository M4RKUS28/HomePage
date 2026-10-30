"""Unit tests for src.db.storage (S3/Garage client wrapper).

Everything is mocked — no DB, no network, no real S3 needed.
Env vars required by Settings (AUTH_*/S3_*) are patched before import.
"""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

os.environ.setdefault("AUTH_INTERNAL_SHARED_SECRET", "x" * 64)
os.environ.setdefault("S3_ACCESS_KEY", "GKtest0000test0000test0000test0000")
os.environ.setdefault("S3_SECRET_KEY", "y" * 64)

from src.db import storage as storage_mod  # noqa: E402


def _s3_cfg(**kw):
    defaults = dict(
        endpoint="garage:3900",
        access_key="GKtest",
        secret_key="sekret",
        bucket="homepage",
        secure=False,
        region="garage",
        presigned_expiry=3600,
        public_url=None,
    )
    defaults.update(kw)
    return SimpleNamespace(**defaults)


def _make(cfg=None):
    """Build an S3Storage with a mocked Minio client + patched settings."""
    with patch.object(storage_mod, "Minio") as minio_cls, \
         patch.object(storage_mod, "settings", SimpleNamespace(s3=cfg or _s3_cfg())):
        obj = storage_mod.S3Storage()
    return obj, minio_cls


class TestClientConstruction(unittest.TestCase):
    def test_region_passed_to_minio_client(self):
        obj, minio_cls = _make()
        minio_cls.assert_called_once_with(
            "garage:3900",
            access_key="GKtest",
            secret_key="sekret",
            secure=False,
            region="garage",
        )
        self.assertEqual(obj._bucket, "homepage")


class TestEnsureBucket(unittest.TestCase):
    def test_existing_bucket_no_create(self):
        obj, _ = _make()
        obj._client.bucket_exists.return_value = True
        obj.ensure_bucket()
        obj._client.make_bucket.assert_not_called()

    def test_missing_bucket_raises(self):
        obj, _ = _make()
        obj._client.bucket_exists.return_value = False
        with self.assertRaises(RuntimeError):
            obj.ensure_bucket()
        obj._client.make_bucket.assert_not_called()


class TestPresignedUrls(unittest.TestCase):
    def test_rewrite_public_url_host_and_path(self):
        cfg = _s3_cfg(public_url="https://www.m4rkus28.de/storage")
        obj, _ = _make(cfg)
        signed = (
            "http://garage:3900/homepage/img.png"
            "?X-Amz-Credential=a%2Fb&X-Amz-Signature=deadbeef"
        )
        obj._client.presigned_get_object.return_value = signed
        out = obj.presigned_get_url("img.png")
        self.assertTrue(out.startswith("https://www.m4rkus28.de/storage/homepage/img.png"))
        # query string untouched, still percent-encoded
        self.assertIn("?X-Amz-Credential=a%2Fb&X-Amz-Signature=deadbeef", out)

    def test_put_rewrite(self):
        cfg = _s3_cfg(public_url="https://www.m4rkus28.de/storage")
        obj, _ = _make(cfg)
        signed = "http://garage:3900/homepage/up.bin?X-Amz-Algorithm=AWS4-HMAC-SHA256"
        obj._client.presigned_put_object.return_value = signed
        out = obj.presigned_put_url("up.bin")
        self.assertTrue(out.startswith("https://www.m4rkus28.de/storage/homepage/up.bin"))

    def test_no_public_url_leaves_signed_url(self):
        obj, _ = _make()  # public_url=None
        signed = "http://garage:3900/homepage/img.png?X-Amz-Signature=abc"
        obj._client.presigned_get_object.return_value = signed
        self.assertEqual(obj.presigned_get_url("img.png"), signed)


class TestObjectOps(unittest.TestCase):
    def test_upload_passes_content_type(self):
        obj, _ = _make()
        obj._client.bucket_exists.return_value = True
        obj.upload_file("a.png", b"123", content_type="image/png")
        args, kwargs = obj._client.put_object.call_args
        self.assertEqual(args[0], "homepage")
        self.assertEqual(args[1], "a.png")
        self.assertEqual(kwargs["content_type"], "image/png")
        self.assertEqual(kwargs["length"], 3)

    def test_delete_file(self):
        obj, _ = _make()
        obj.delete_file("gone.png")
        obj._client.remove_object.assert_called_once_with("homepage", "gone.png")

    def test_file_exists_uses_stat(self):
        obj, _ = _make()
        obj._client.stat_object.return_value = MagicMock()
        self.assertTrue(obj.file_exists("there.png"))
        obj._client.stat_object.side_effect = storage_mod.S3Error(
            response=MagicMock(), code="NoSuchKey", message="missing",
            resource="o", request_id="r", host_id="h")
        self.assertFalse(obj.file_exists("missing.png"))


class TestSettings(unittest.TestCase):
    def test_s3_settings_env_and_defaults(self):
        with patch.dict(os.environ, {
            "S3_ACCESS_KEY": "GKabc",
            "S3_SECRET_KEY": "s3cr3t",
            "S3_ENDPOINT": "garage:3900",
            "S3_REGION": "garage",
        }, clear=False):
            from src.core.config import S3Settings
            cfg = S3Settings()
        self.assertEqual(cfg.region, "garage")
        self.assertEqual(cfg.bucket, "homepage")
        self.assertFalse(cfg.secure)
        self.assertEqual(cfg.access_key, "GKabc")


if __name__ == "__main__":
    unittest.main()
