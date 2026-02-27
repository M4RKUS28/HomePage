"""Access-log endpoints – admin only."""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.dependencies import get_current_admin_user, get_db
from ...db.models.access_log import AccessLog
from ...db.models.user import User
from ...db.crud import access_log as access_crud
from ..schemas.access_log import AccessLogRead, AccessLogStats

router = APIRouter(prefix="/access", tags=["access"])


@router.get("/", response_model=List[AccessLogRead])
async def list_access_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    hours: Optional[int] = Query(None, ge=1, le=8760, description="Filter last N hours"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Return access logs, optionally filtered by time range."""
    if hours:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        return await access_crud.get_access_logs_since(db, since=since, skip=skip, limit=limit)
    return await access_crud.get_access_logs(db, skip=skip, limit=limit)


@router.get("/stats", response_model=AccessLogStats)
async def access_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Aggregated access statistics."""
    total = await access_crud.count_access_logs(db)

    # Unique IPs
    result = await db.execute(
        select(func.count(func.distinct(AccessLog.ip_address)))
    )
    unique_ips = result.scalar_one()

    # Top countries
    result = await db.execute(
        select(AccessLog.country, func.count(AccessLog.id).label("cnt"))
        .where(AccessLog.country.isnot(None))
        .group_by(AccessLog.country)
        .order_by(func.count(AccessLog.id).desc())
        .limit(10)
    )
    top_countries = [{"country": row.country, "count": row.cnt} for row in result.all()]

    # Last 24h
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    result = await db.execute(
        select(func.count(AccessLog.id)).where(AccessLog.timestamp >= since_24h)
    )
    recent_count = result.scalar_one()

    return AccessLogStats(
        total=total,
        unique_ips=unique_ips,
        top_countries=top_countries,
        recent_count=recent_count,
    )
