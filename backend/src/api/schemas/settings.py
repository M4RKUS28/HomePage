"""Schemas for admin-configurable application settings."""

from typing import List

from pydantic import BaseModel, Field


class TranslationModelRead(BaseModel):
    """Current translation model plus the env default and UI suggestions."""

    model: str
    default_model: str
    suggestions: List[str]


class TranslationModelUpdate(BaseModel):
    model: str = Field(..., min_length=1, max_length=100)
