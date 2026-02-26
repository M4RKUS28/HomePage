"""
CRUD operations for the User model.

Every function takes an ``AsyncSession`` as first argument and returns
model instances or scalars – no HTTP / FastAPI concerns here.
"""

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_users(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> Sequence[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


async def count_admins(db: AsyncSession) -> int:
    result = await db.execute(select(func.count()).where(User.is_admin.is_(True)))
    return result.scalar_one()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def create_user(
    db: AsyncSession,
    *,
    username: str,
    email: str,
    hashed_password: str,
    is_admin: bool = False,
    is_active: bool = True,
) -> User:
    user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        is_admin=is_admin,
        is_active=is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

async def update_user(
    db: AsyncSession,
    user: User,
    **kwargs,
) -> User:
    """
    Apply arbitrary attribute updates to *user* and commit.

    Only keys present in ``kwargs`` are set; unknown keys are silently ignored.
    """
    valid_fields = {c.key for c in User.__table__.columns}
    for key, value in kwargs.items():
        if key in valid_fields:
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def delete_user(db: AsyncSession, user: User) -> None:
    await db.delete(user)
    await db.commit()
