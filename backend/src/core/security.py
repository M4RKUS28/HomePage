"""
Internal service-token security.

NextJS signs a JWT with a shared secret (HMAC-HS256).
FastAPI validates that JWT here - no login / register endpoints needed.

Additionally provides password hashing helpers (used for admin seeding).
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# ---------------------------------------------------------------------------
# Password hashing (used only for admin seeding, NOT for runtime auth)
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ---------------------------------------------------------------------------
# Internal service-token helpers
# ---------------------------------------------------------------------------

def decode_internal_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT signed by NextJS with the shared secret.

    Returns the decoded payload dict on success, ``None`` on any failure.
    Expected payload::

        {
            "sub": "<username>",
            "user_id": <int>,
            "is_admin": <bool>,
            "exp": <unix-timestamp>
        }
    """
    try:
        payload = jwt.decode(
            token,
            settings.auth.internal_shared_secret,
            algorithms=[settings.auth.algorithm],
        )
        # Verify required claims
        if payload.get("sub") is None or payload.get("user_id") is None:
            logger.warning("Token missing required claims (sub / user_id)")
            return None
        return payload
    except JWTError as exc:
        logger.warning("Invalid internal token: %s", exc)
        return None


def create_internal_token(
    *,
    username: str,
    user_id: int,
    is_admin: bool = False,
    expires_delta: Optional[int] = None,
) -> str:
    """
    Create a signed JWT (for testing / admin seeding).

    In production this is done by NextJS - this helper exists for dev/test.
    """
    from datetime import timedelta

    expire_minutes = expires_delta or settings.auth.token_expire_minutes
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {
        "sub": username,
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": expire,
    }
    return jwt.encode(
        payload,
        settings.auth.internal_shared_secret,
        algorithm=settings.auth.algorithm,
    )
