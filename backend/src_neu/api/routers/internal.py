"""
Internal auth endpoints – called exclusively by the NextJS backend.

Protected by the ``X-Internal-Key`` header, which must match
``AUTH_INTERNAL_SHARED_SECRET``. These endpoints are **not** reachable
through nginx – they live on the internal Docker network only.

Flow:
  1. Browser → NextJS ``/api/auth/login`` (or ``/register``)
  2. NextJS  → FastAPI ``/internal/login`` (with X-Internal-Key header)
  3. FastAPI validates credentials, signs HMAC-JWT, returns token + user
  4. NextJS  → Browser (stores token in cookie)
"""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import get_settings
from ...core.security import create_internal_token, get_password_hash, verify_password
from ...db.crud import user as user_crud
from ...db.minio import get_minio
from ...db.session import get_db
from ..schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from ..schemas.user import UserRead

logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Internal-key guard
# ---------------------------------------------------------------------------

async def _verify_internal_key(
    x_internal_key: str = Header(..., alias="X-Internal-Key"),
) -> None:
    """Reject requests that don't carry the correct internal key."""
    if x_internal_key != settings.auth.internal_shared_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal key",
        )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(
    prefix="/internal",
    tags=["internal"],
    dependencies=[Depends(_verify_internal_key)],
)


def _build_user_read(user) -> UserRead:
    """Convert a User ORM instance to a UserRead schema."""
    avatar_url = None
    if user.avatar_object_name:
        minio = get_minio()
        avatar_url = minio.presigned_get_url(user.avatar_object_name)

    return UserRead(
        id=user.id,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        is_admin=user.is_admin,
        avatar_url=avatar_url,
    )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
async def internal_login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify username + password and return a signed HMAC-JWT.

    Called by NextJS ``/api/auth/login`` route.
    """
    user = await user_crud.get_user_by_username(db, body.username)

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    token = create_internal_token(
        username=user.username,
        user_id=user.id,
        is_admin=user.is_admin,
    )

    logger.info("Internal login succeeded for user '%s' (id=%d)", user.username, user.id)

    return AuthResponse(
        access_token=token,
        user=_build_user_read(user),
    )


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def internal_register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user account and return a signed HMAC-JWT.

    Called by NextJS ``/api/auth/register`` route.
    """
    # Uniqueness checks
    if await user_crud.get_user_by_username(db, body.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    if await user_crud.get_user_by_email(db, body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed = get_password_hash(body.password)
    user = await user_crud.create_user(
        db,
        username=body.username,
        email=body.email,
        hashed_password=hashed,
    )

    token = create_internal_token(
        username=user.username,
        user_id=user.id,
        is_admin=user.is_admin,
    )

    logger.info("Internal register succeeded for user '%s' (id=%d)", user.username, user.id)

    return AuthResponse(
        access_token=token,
        user=_build_user_read(user),
    )
