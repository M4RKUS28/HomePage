"""
CV service - business logic for curriculum vitae management.
"""

import logging
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.schemas.cv import CVData
from ..core.config import get_settings
from ..db.crud import cv as cv_crud
from . import translation as translation_service

logger = logging.getLogger(__name__)
settings = get_settings()

# Max upload size for AI-assisted CV import (10 MB)
_MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024

# MIME types Gemini can read directly as document/image input
_SUPPORTED_IMPORT_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
}


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


async def import_cv_from_file(
    db: AsyncSession,
    *,
    file: UploadFile,
    mode: str,
    language: str = "en",
) -> CVData:
    """Use the configured Gemini model to turn an uploaded CV/resume file into CV data.

    ``mode`` is either:
      * ``"replace"`` - generate completely fresh CV data from the file alone.
      * ``"merge"``   - merge the file's content into the existing CV data for
        ``language``, extending it rather than discarding it.

    The result is NOT persisted - the caller (admin UI) reviews it and saves
    via the regular ``PUT /cv/`` endpoint.
    """
    if mode not in ("replace", "merge"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="mode must be 'replace' or 'merge'",
        )

    if not settings.gemini.api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI CV import is not configured (missing Gemini API key).",
        )

    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in _SUPPORTED_IMPORT_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type '{mime_type}'. "
                "Please upload a PDF, plain text, or image (PNG/JPEG/WEBP) file."
            ),
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if len(file_bytes) > _MAX_IMPORT_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large (max 10 MB).",
        )

    existing_data: Optional[dict] = None
    if mode == "merge":
        cv = await cv_crud.get_cv(db, language=language)
        if cv:
            existing_data = cv.data

    model = await translation_service.get_active_model(db)

    try:
        generated = await translation_service.generate_cv_from_file(
            file_bytes=file_bytes,
            mime_type=mime_type,
            model=model,
            existing_data=existing_data,
        )
    except Exception as exc:
        logger.error("[cv] AI CV import failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to process the CV with AI. Please try again.",
        )

    return CVData.model_validate(generated)


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
