"""
CRUD operations for the CV model.
"""

from typing import Optional, Sequence

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


async def get_cvs_with_changes(db: AsyncSession) -> Sequence[CV]:
    """Return all CV records where has_changes is True."""
    result = await db.execute(select(CV).where(CV.has_changes == True))  # noqa: E712
    return result.scalars().all()


async def check_pending_changes_other_language(
    db: AsyncSession, *, exclude_language: str
) -> bool:
    """Check if any CV in a DIFFERENT language has pending changes."""
    result = await db.execute(
        select(CV.id)
        .where(CV.language != exclude_language, CV.has_changes == True)  # noqa: E712
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


# ---------------------------------------------------------------------------
# Create / Update (upsert)
# ---------------------------------------------------------------------------

async def upsert_cv(
    db: AsyncSession,
    *,
    data: dict,
    owner_id: int,
    language: str = "en",
    has_changes: bool = False,
) -> CV:
    """Create or update the CV record for a given language."""
    existing = await get_cv(db, language=language)
    if existing:
        existing.data = data
        existing.owner_id = owner_id
        existing.has_changes = has_changes
        await db.commit()
        await db.refresh(existing)
        return existing

    cv = CV(data=data, owner_id=owner_id, language=language, has_changes=has_changes)
    db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return cv
