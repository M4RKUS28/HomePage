"""
CRUD operations for the AccessLog model.
"""

from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.access_log import AccessLog


async def create_access_log(
    db: AsyncSession,
    *,
    ip_address: str,
    city: Optional[str] = None,
    region: Optional[str] = None,
    country: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    org: Optional[str] = None,
    timezone: Optional[str] = None,
    range_minutes: int = 10,
    timestamp: Optional[datetime] = None,
) -> AccessLog:
    log = AccessLog(
        ip_address=ip_address,
        city=city,
        region=region,
        country=country,
        latitude=latitude,
        longitude=longitude,
        org=org,
        timezone=timezone,
        range_minutes=range_minutes,
    )
    if timestamp:
        log.timestamp = timestamp
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_access_logs(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 200,
) -> Sequence[AccessLog]:
    result = await db.execute(
        select(AccessLog).order_by(desc(AccessLog.timestamp)).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def count_access_logs(db: AsyncSession) -> int:
    result = await db.execute(select(func.count(AccessLog.id)))
    return result.scalar_one()


async def get_access_logs_since(
    db: AsyncSession,
    *,
    since: datetime,
    skip: int = 0,
    limit: int = 1000,
) -> Sequence[AccessLog]:
    result = await db.execute(
        select(AccessLog)
        .where(AccessLog.timestamp >= since)
        .order_by(desc(AccessLog.timestamp))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
