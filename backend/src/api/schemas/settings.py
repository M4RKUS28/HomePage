"""Schemas for admin-configurable application settings."""

from typing import List, Optional

from pydantic import BaseModel, Field

HEX_COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"


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
    """``color: null`` resets to the built-in default."""

    color: Optional[str] = Field(None, pattern=HEX_COLOR_PATTERN)


class AutoTranslationRead(BaseModel):
    """Whether edits are automatically translated into the other languages."""

    enabled: bool


class AutoTranslationUpdate(BaseModel):
    enabled: bool
