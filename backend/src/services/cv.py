"""
CV service - business logic for curriculum vitae management.
"""

import logging
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.schemas.cv import CVData
from ..db.crud import cv as cv_crud

logger = logging.getLogger(__name__)


async def get_cv_data(db: AsyncSession, *, language: str = "en") -> CVData:
    """Return current CV data (public endpoint, no auth required)."""
    cv = await cv_crud.get_cv(db, language=language)
    if cv is None:
        return CVData()  # empty defaults
    return CVData.model_validate(cv.data)


async def update_cv_data(
    db: AsyncSession,
    *,
    data: CVData,
    owner_id: int,
    language: str = "en",
) -> CVData:
    """Create or update the CV record for a given language.

    Raises HTTP 409 if another language has pending (untranslated) changes.
    """
    # Conflict check: reject if another language has pending changes
    has_conflict = await cv_crud.check_pending_changes_other_language(
        db, exclude_language=language
    )
    if has_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot save CV for '{language}': another language has pending "
                "changes that must be translated first. Please wait for the "
                "automatic translation to complete."
            ),
        )

    cv = await cv_crud.upsert_cv(
        db, data=data.model_dump(), owner_id=owner_id,
        language=language, has_changes=True,
    )
    return CVData.model_validate(cv.data)


async def init_default_cv(db: AsyncSession, owner_id: int) -> None:
    """Seed default CV data if none exists (called on startup)."""
    existing = await cv_crud.get_cv(db)
    if existing:
        return

    default_data = {
        "summary": "",
        "experience": [],
        "education": [],
        "projectsHighlight": [],
        "skills": [],
        "personalInfo": {
            "name": "[Your Name]",
            "title": "title",
            "profileImage": "",
            "headerText": "headerText",
            "socialLinks": [
                {"platform": "github", "url": "https://github.com/yourname"},
                {"platform": "email", "url": "mailto:you@example.com"},
            ],
        },
    }
    await cv_crud.upsert_cv(db, data=default_data, owner_id=owner_id)
    logger.info("Initialised default CV data for owner %d", owner_id)
