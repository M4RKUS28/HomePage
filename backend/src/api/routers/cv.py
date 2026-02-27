"""CV (Curriculum Vitae) endpoints."""

from fastapi import APIRouter, Depends
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return await cv_service.update_cv_data(db, data=data, owner_id=current_user.id)
