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

async def get_cv(db: AsyncSession, *, language: str = "en") -> Optional[CV]:
    """Get the CV record for a given language (defaults to English)."""
    result = await db.execute(select(CV).where(CV.language == language).limit(1))
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Create / Update (upsert)
# ---------------------------------------------------------------------------

async def upsert_cv(
    db: AsyncSession,
    *,
    data: dict,
    owner_id: int,
    language: str = "en",
) -> CV:
    """Create or update the CV record for a given language."""
    existing = await get_cv(db, language=language)
    if existing:
        existing.data = data
        existing.owner_id = owner_id
        await db.commit()
        await db.refresh(existing)
        return existing

    cv = CV(data=data, owner_id=owner_id, language=language)
    db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return cv
