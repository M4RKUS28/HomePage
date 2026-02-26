"""Pydantic schemas for CV endpoints."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CVData(BaseModel):
    """Flexible CV data structure - stored as JSON in PostgreSQL JSONB."""
    summary: Optional[str] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    projectsHighlight: Optional[List[Dict[str, Any]]] = None
    awards: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[Dict[str, Any]]] = None
    volunteering: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[Dict[str, Any]]] = None
    personalInfo: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class CVRead(BaseModel):
    id: int
    owner_id: int
    data: CVData

    model_config = {"from_attributes": True}
