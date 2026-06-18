"""Schemas for admin-configurable application settings."""

import re
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

HEX_COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"

# Sentinel accepted instead of a hex: a fresh random accent on every page load.
RANDOM_ACCENT = "random"


class TranslationModelRead(BaseModel):
    """Current translation model plus the env default and UI suggestions."""

    model: str
    default_model: str
    suggestions: List[str]


class TranslationModelUpdate(BaseModel):
    model: str = Field(..., min_length=1, max_length=100)


class PublicSettingsRead(BaseModel):
    """Site-wide settings safe to expose without authentication."""

    accent_color: Optional[str] = None
    default_accent_color: str


class AccentColorUpdate(BaseModel):
    """Site accent color.

    ``null`` resets to the built-in default, ``"random"`` picks a fresh color on
    every page load, and a 6-digit hex (e.g. ``#FFB224``) sets a fixed color.
    """

    color: Optional[str] = Field(None, max_length=7)

    @field_validator("color")
    @classmethod
    def _normalize_color(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if value.lower() == RANDOM_ACCENT:
            return RANDOM_ACCENT
        if not re.match(HEX_COLOR_PATTERN, value):
            raise ValueError("color must be a 6-digit hex like '#FFB224' or 'random'")
        return value.upper()


class AutoTranslationRead(BaseModel):
    """Whether edits are automatically translated into the other languages."""

    enabled: bool


class AutoTranslationUpdate(BaseModel):
    enabled: bool
