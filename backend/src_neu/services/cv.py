"""
CV service - business logic for curriculum vitae management.
"""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..api.schemas.cv import CVData
from ..db.crud import cv as cv_crud

logger = logging.getLogger(__name__)


async def get_cv_data(db: AsyncSession) -> CVData:
    """Return current CV data (public endpoint, no auth required)."""
    cv = await cv_crud.get_cv(db)
    if cv is None:
        return CVData()  # empty defaults
    return CVData.model_validate(cv.data)


async def update_cv_data(
    db: AsyncSession,
    *,
    data: CVData,
    owner_id: int,
) -> CVData:
    """Create or update the CV record."""
    cv = await cv_crud.upsert_cv(db, data=data.model_dump(), owner_id=owner_id)
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
