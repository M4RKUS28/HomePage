"""CRUD for the generic ``app_settings`` key/value store."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.app_setting import AppSetting

# Known setting keys
TRANSLATION_MODEL_KEY = "translation_gemini_model"
ACCENT_COLOR_KEY = "theme_accent_color"
AUTO_TRANSLATION_ENABLED_KEY = "auto_translation_enabled"


async def get_setting(db: AsyncSession, key: str) -> Optional[str]:
    """Return the stored value for *key*, or ``None`` if unset."""
    result = await db.execute(select(AppSetting).where(AppSetting.key == key))
    row = result.scalar_one_or_none()
    return row.value if row else None


async def set_setting(db: AsyncSession, key: str, value: str) -> AppSetting:
    """Insert or update *key* with *value* (upsert)."""
    result = await db.execute(select(AppSetting).where(AppSetting.key == key))
    row = result.scalar_one_or_none()
    if row:
        row.value = value
    else:
        row = AppSetting(key=key, value=value)
        db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def delete_setting(db: AsyncSession, key: str) -> bool:
    """Remove *key* if present. Returns True when a row was deleted."""
    result = await db.execute(select(AppSetting).where(AppSetting.key == key))
    row = result.scalar_one_or_none()
    if row is None:
        return False
    await db.delete(row)
    await db.commit()
    return True


async def is_auto_translation_enabled(db: AsyncSession) -> bool:
    """Whether edits are automatically translated. Defaults to True when unset."""
    value = await get_setting(db, AUTO_TRANSLATION_ENABLED_KEY)
    if value is None:
        return True
    return value.lower() == "true"
