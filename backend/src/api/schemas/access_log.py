"""Pydantic schemas for AccessLog endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AccessLogRead(BaseModel):
    id: int
    ip_address: str
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    org: Optional[str] = None
    timezone: Optional[str] = None
    range_minutes: int = 10
    timestamp: datetime

    model_config = {"from_attributes": True}


class AccessLogStats(BaseModel):
    total: int
    unique_ips: int
    top_countries: list[dict]
    recent_count: int  # last 24h
