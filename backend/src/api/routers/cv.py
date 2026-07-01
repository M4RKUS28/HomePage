"""CV (Curriculum Vitae) endpoints."""

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.dependencies import get_current_admin_user, get_db
from ...db.models.user import User
from ...services import cv as cv_service
from ..schemas.cv import CVData

router = APIRouter(prefix="/cv", tags=["cv"])


@router.get("/", response_model=CVData)
async def read_cv(
    language: str = "en",
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint - returns the CV data without authentication."""
    return await cv_service.get_cv_data(db, language=language)


@router.put("/", response_model=CVData)
async def update_cv(
    data: CVData,
    language: str = "en",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return await cv_service.update_cv_data(
        db, data=data, owner_id=current_user.id, language=language
    )


@router.post("/import", response_model=CVData)
async def import_cv(
    file: UploadFile = File(...),
    mode: str = Form(...),
    language: str = "en",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    AI-assisted CV import (admin only).

    Uploads a CV/resume file (PDF, image, or text) and uses the configured
    Gemini model to extract its content into the CV JSON structure.

    ``mode="replace"`` generates fresh CV data from the file alone.
    ``mode="merge"`` merges the file's content into the existing CV data
    for ``language``.

    The result is returned for review - it is NOT saved automatically.
    Use ``PUT /cv/`` to persist the reviewed data.
    """
    return await cv_service.import_cv_from_file(
        db, file=file, mode=mode, language=language
    )
