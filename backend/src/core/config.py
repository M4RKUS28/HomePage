"""
Application settings powered by pydantic-settings.

* Reads from environment variables / .env file automatically.
* Grouped into logical sections via nested models.
* Singleton via @lru_cache - import ``get_settings()`` everywhere.
"""

import re
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# ---------------------------------------------------------------------------
# Nested setting groups (plain BaseModel so they don't read ENV themselves)
# ---------------------------------------------------------------------------

class DatabaseSettings(BaseSettings):
    """PostgreSQL connection settings (async via asyncpg)."""
    model_config = SettingsConfigDict(env_prefix="DB_")

    user: str = "postgres"
    password: str = "postgres"
    host: str = "localhost"
    port: int = 5432
    name: str = "homepage"
    echo: bool = False  # SQLAlchemy echo (SQL logging)

    # Pool tuning
    pool_size: int = 10
    max_overflow: int = 20
    pool_recycle: int = 3600
    pool_pre_ping: bool = True

    @property
    def async_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.name}"
        )

    @property
    def sync_url(self) -> str:
        """Needed by Alembic (which uses sync connections)."""
        return (
            f"postgresql+psycopg2://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.name}"
        )


class RedisSettings(BaseSettings):
    """Redis connection settings."""
    model_config = SettingsConfigDict(env_prefix="REDIS_")

    host: str = "redis"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None

    @property
    def url(self) -> str:
        auth = f":{self.password}@" if self.password else ""
        return f"redis://{auth}{self.host}:{self.port}/{self.db}"


class S3Settings(BaseSettings):
    """S3-compatible object storage settings (Garage)."""
    model_config = SettingsConfigDict(env_prefix="S3_")

    endpoint: str = "garage:3900"
    access_key: str = Field(..., repr=False)
    secret_key: str = Field(..., repr=False)
    bucket: str = "homepage"
    secure: bool = False
    region: str = "garage"
    presigned_expiry: int = 3600  # seconds for presigned URLs

    # Public URL prefix (used for constructing browser-accessible presigned URLs)
    # e.g. "https://cdn.example.com" or "http://localhost:9000"
    public_url: Optional[str] = None


class EmailSettings(BaseSettings):
    """SMTP email settings (aiosmtplib)."""
    model_config = SettingsConfigDict(env_prefix="EMAIL_")

    enabled: bool = False
    host: str = "smtp.gmail.com"
    port: int = 587
    username: str = ""
    password: str = ""
    from_address: str = Field(default="", alias="EMAIL_FROM")
    to_admin: str = Field(default="", alias="EMAIL_TO_ADMIN")
    use_tls: bool = True
    use_ssl: bool = False


MIN_INTERNAL_SECRET_LENGTH = 32
_PLACEHOLDER_SECRET_MARKERS = ("changeme", "example", "placeholder")


class AuthSettings(BaseSettings):
    """
    Internal service-token settings (NextJS → FastAPI).

    NextJS signs a JWT with INTERNAL_SHARED_SECRET; FastAPI validates it.
    No login / register endpoints in the backend.
    """
    model_config = SettingsConfigDict(env_prefix="AUTH_", hide_input_in_errors=True)

    # Required: no default, startup fails if missing / weak / placeholder.
    internal_shared_secret: str = Field(..., repr=False)
    algorithm: str = "HS256"
    # Token lifetime used by NextJS when signing (FastAPI just validates exp)
    token_expire_minutes: int = 60

    @field_validator("internal_shared_secret")
    @classmethod
    def _validate_internal_shared_secret(cls, value: str) -> str:
        value = value.strip()
        if len(value) < MIN_INTERNAL_SECRET_LENGTH:
            raise ValueError(
                "AUTH_INTERNAL_SHARED_SECRET must be at least "
                f"{MIN_INTERNAL_SECRET_LENGTH} characters "
                "(generate one with: openssl rand -hex 32)"
            )
        normalized = re.sub(r"[^a-z0-9]", "", value.lower())
        if any(marker in normalized for marker in _PLACEHOLDER_SECRET_MARKERS):
            raise ValueError(
                "AUTH_INTERNAL_SHARED_SECRET is a placeholder value; "
                "set a random secret (openssl rand -hex 32)"
            )
        return value


class AdminSettings(BaseSettings):
    """Initial admin account (seeded on first startup)."""
    model_config = SettingsConfigDict(env_prefix="ADMIN_")

    username: str = ""
    email: str = ""
    password: str = ""


class GeminiSettings(BaseSettings):
    """Google Gemini API settings for automatic translation."""
    model_config = SettingsConfigDict(env_prefix="GOOGLE_")

    api_key: str = ""
    model: str = "gemini-3.1-pro-preview"


class TranslationSettings(BaseSettings):
    """Automatic translation sync settings."""
    model_config = SettingsConfigDict(env_prefix="TRANSLATION_")

    enabled: bool = False
    interval_minutes: int = 1
    supported_languages: List[str] = ["en", "de", "vi", "fr", "it", "zh", "ja", "es", "pt"]


class PasswordPolicySettings(BaseSettings):
    """Password complexity policy (enforced in NextJS; kept here for reference/validation)."""
    model_config = SettingsConfigDict(env_prefix="PW_")

    min_length: int = 8
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_digit: bool = True
    require_special_char: bool = False


# ---------------------------------------------------------------------------
# Root settings
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    """
    Root application settings.

    Values can come from:
      1. Environment variables (highest priority)
      2. .env file (auto-discovered)
      3. Defaults below (lowest priority)
    """
    model_config = SettingsConfigDict(
        # Repo-root .env first, a local .env (cwd) may override. In Docker both
        # are absent — values come from the process env (compose env_file).
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",  # ignore unknown env vars
    )

    # Application
    app_name: str = "Homepage API"
    debug: bool = False
    root_path: str = "/api"
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://www.m4rkus28.de",
    ]

    # IPinfo token for geolocation (optional – works without token at lower rate limit)
    ipinfo_token: str = ""

    # Sub-configs (populated from env with their respective prefixes)
    db: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    s3: S3Settings = S3Settings()
    email: EmailSettings = EmailSettings()
    auth: AuthSettings = AuthSettings()
    admin: AdminSettings = AdminSettings()
    password_policy: PasswordPolicySettings = PasswordPolicySettings()
    gemini: GeminiSettings = GeminiSettings()
    translation: TranslationSettings = TranslationSettings()


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings singleton.

    Usage::

        from app.core.config import get_settings
        settings = get_settings()
        print(settings.db.async_url)
    """
    return Settings()
