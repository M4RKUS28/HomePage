"""
CRUD operations for the CV model.
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.cv import CV


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

async def get_cv(db: AsyncSession) -> Optional[CV]:
    """Get the single CV record (the app has one CV)."""
    result = await db.execute(select(CV).limit(1))
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Create / Update (upsert)
# ---------------------------------------------------------------------------

async def upsert_cv(
    db: AsyncSession,
    *,
    data: dict,
    owner_id: int,
) -> CV:
    """Create or update the CV record."""
    existing = await get_cv(db)
    if existing:
        existing.data = data
        existing.owner_id = owner_id
        await db.commit()
        await db.refresh(existing)
        return existing

    cv = CV(data=data, owner_id=owner_id)
    db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return cv
