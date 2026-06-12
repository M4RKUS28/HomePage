"""Admin-configurable application settings (admin only)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import get_settings
from ...core.dependencies import get_current_admin_user, get_db
from ...db.crud import app_setting as settings_crud
from ..schemas.settings import (
    AccentColorUpdate,
    PublicSettingsRead,
    TranslationModelRead,
    TranslationModelUpdate,
)

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_admin_user)],
)

# Read-only settings needed by anonymous visitors (e.g. SSR theme color).
public_router = APIRouter(prefix="/settings", tags=["settings"])

_config = get_settings()

# Built-in frontend accent ("signal amber"); kept here so the admin UI can
# show the default and the public endpoint always returns a usable value.
DEFAULT_ACCENT_COLOR = "#FFB224"

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


# ---------------------------------------------------------------------------
# Theme accent color
# ---------------------------------------------------------------------------

async def _public_settings(db: AsyncSession) -> PublicSettingsRead:
    stored = await settings_crud.get_setting(db, settings_crud.ACCENT_COLOR_KEY)
    return PublicSettingsRead(
        accent_color=stored,
        default_accent_color=DEFAULT_ACCENT_COLOR,
    )


@public_router.get("/public", response_model=PublicSettingsRead)
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Public site settings (no auth). ``accent_color`` is null when unset."""
    return await _public_settings(db)


@router.put("/accent-color", response_model=PublicSettingsRead)
async def update_accent_color(
    payload: AccentColorUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Set the site accent color. ``color: null`` resets to the default. Admin only."""
    if payload.color is None:
        await settings_crud.delete_setting(db, settings_crud.ACCENT_COLOR_KEY)
    else:
        await settings_crud.set_setting(
            db, settings_crud.ACCENT_COLOR_KEY, payload.color.upper()
        )
    return await _public_settings(db)
