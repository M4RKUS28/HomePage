"""CRUD for the generic ``app_settings`` key/value store."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.app_setting import AppSetting

# Known setting keys
TRANSLATION_MODEL_KEY = "translation_gemini_model"


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
