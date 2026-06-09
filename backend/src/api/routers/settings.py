"""Admin-configurable application settings (admin only)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import get_settings
from ...core.dependencies import get_current_admin_user, get_db
from ...db.crud import app_setting as settings_crud
from ..schemas.settings import TranslationModelRead, TranslationModelUpdate

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_admin_user)],
)

_config = get_settings()

# Curated suggestions shown in the admin UI. Free text is still allowed (any
# value starting with "gemini"), so the list can lag behind Google's releases.
SUGGESTED_MODELS = [
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
]


def _read(model: str) -> TranslationModelRead:
    return TranslationModelRead(
        model=model,
        default_model=_config.gemini.model,
        suggestions=SUGGESTED_MODELS,
    )


@router.get("/translation-model", response_model=TranslationModelRead)
async def get_translation_model(db: AsyncSession = Depends(get_db)):
    """Return the active translation model (DB override or env default)."""
    stored = await settings_crud.get_setting(db, settings_crud.TRANSLATION_MODEL_KEY)
    return _read(stored or _config.gemini.model)


@router.put("/translation-model", response_model=TranslationModelRead)
async def update_translation_model(
    payload: TranslationModelUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Set the Gemini model used for automatic translation. Admin only."""
    model = payload.model.strip()
    if not model.lower().startswith("gemini"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Model name must be a Gemini model (e.g. 'gemini-3.1-pro-preview').",
        )
    await settings_crud.set_setting(db, settings_crud.TRANSLATION_MODEL_KEY, model)
    return _read(model)
