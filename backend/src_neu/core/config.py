"""
Application settings powered by pydantic-settings.

* Reads from environment variables / .env file automatically.
* Grouped into logical sections via nested models.
* Singleton via @lru_cache - import ``get_settings()`` everywhere.
"""

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
            f"postgresql+psycopg://{self.user}:{self.password}"
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


class MinioSettings(BaseSettings):
    """S3-compatible object storage settings."""
    model_config = SettingsConfigDict(env_prefix="MINIO_")

    endpoint: str = "minio:9000"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket: str = "homepage"
    secure: bool = False
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


class AuthSettings(BaseSettings):
    """
    Internal service-token settings (NextJS → FastAPI).

    NextJS signs a JWT with INTERNAL_SHARED_SECRET; FastAPI validates it.
    No login / register endpoints in the backend.
    """
    model_config = SettingsConfigDict(env_prefix="AUTH_")

    internal_shared_secret: str = "change-me-in-production"
    algorithm: str = "HS256"
    # Token lifetime used by NextJS when signing (FastAPI just validates exp)
    token_expire_minutes: int = 60


class AdminSettings(BaseSettings):
    """Initial admin account (seeded on first startup)."""
    model_config = SettingsConfigDict(env_prefix="ADMIN_")

    username: str = ""
    email: str = ""
    password: str = ""


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
        env_file=".env",
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

    # Sub-configs (populated from env with their respective prefixes)
    db: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    minio: MinioSettings = MinioSettings()
    email: EmailSettings = EmailSettings()
    auth: AuthSettings = AuthSettings()
    admin: AdminSettings = AdminSettings()
    password_policy: PasswordPolicySettings = PasswordPolicySettings()


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
