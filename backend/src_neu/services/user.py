"""
User service – business logic for user management.

Orchestrates: CRUD operations, password hashing, MinIO avatar handling.
"""

import logging
from typing import Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.schemas.user import UserCreate, UserUpdate
from ..core.security import get_password_hash
from ..db.crud import user as user_crud
from ..db.minio import get_minio
from ..db.models.user import User

logger = logging.getLogger(__name__)

ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB


async def list_users(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> Sequence[User]:
    return await user_crud.get_users(db, skip=skip, limit=limit)


async def get_user(db: AsyncSession, user_id: int) -> User:
    user = await user_crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    """Create a new user (admin seeding / internal use)."""
    # Check uniqueness
    if await user_crud.get_user_by_username(db, data.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    if await user_crud.get_user_by_email(db, data.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = get_password_hash(data.password)
    return await user_crud.create_user(
        db,
        username=data.username,
        email=data.email,
        hashed_password=hashed,
        is_admin=data.is_admin,
    )


async def update_user(
    db: AsyncSession,
    user_id: int,
    data: UserUpdate,
    current_user: User,
) -> User:
    """
    Update a user's profile.

    Enforces:
    - Regular users can only update themselves.
    - Only admins can change is_active / is_admin.
    - Cannot remove the last admin's privileges.
    """
    target = await get_user(db, user_id)

    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to update this user")

    changes = data.model_dump(exclude_unset=True)

    # Username uniqueness
    if "username" in changes:
        existing = await user_crud.get_user_by_username(db, changes["username"])
        if existing and existing.id != user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    # Email uniqueness
    if "email" in changes:
        existing = await user_crud.get_user_by_email(db, changes["email"])
        if existing and existing.id != user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Password hashing
    if "password" in changes and changes["password"]:
        changes["hashed_password"] = get_password_hash(changes.pop("password"))
    else:
        changes.pop("password", None)

    # Admin-only fields
    for field in ("is_active", "is_admin"):
        if field in changes and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Only admins can change {field}",
            )

    # Prevent removing last admin
    if "is_admin" in changes and not changes["is_admin"] and target.id == current_user.id:
        admin_count = await user_crud.count_admins(db)
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last admin's privileges",
            )

    return await user_crud.update_user(db, target, **changes)


async def delete_user(db: AsyncSession, user_id: int, current_user: User) -> None:
    """Delete a user (admin only, cannot delete self)."""
    target = await get_user(db, user_id)
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot delete themselves")

    # Clean up avatar
    if target.avatar_object_name:
        get_minio().delete_file(target.avatar_object_name)

    await user_crud.delete_user(db, target)


async def delete_own_account(db: AsyncSession, current_user: User) -> None:
    """Self-service account deletion (non-admins only)."""
    if current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot delete their own account via this endpoint",
        )
    if current_user.avatar_object_name:
        get_minio().delete_file(current_user.avatar_object_name)

    await user_crud.delete_user(db, current_user)


async def upload_avatar(
    db: AsyncSession,
    current_user: User,
    file_data: bytes,
    content_type: str,
) -> User:
    """Upload / replace the user's profile picture via server-side MinIO upload."""
    if content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported type '{content_type}'. Allowed: jpeg, png, webp, gif.",
        )
    if len(file_data) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5 MB.",
        )

    minio = get_minio()

    # Delete old avatar
    if current_user.avatar_object_name:
        minio.delete_file(current_user.avatar_object_name)

    ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
    object_name = f"avatars/{current_user.id}.{ext}"
    minio.upload_file(object_name, file_data, content_type)

    return await user_crud.update_user(db, current_user, avatar_object_name=object_name)


def get_avatar_url(user: User) -> Optional[str]:
    """Generate a presigned download URL for the user's avatar."""
    if not user.avatar_object_name:
        return None
    return get_minio().presigned_get_url(user.avatar_object_name)
