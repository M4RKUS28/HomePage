"""
CRUD operations for the Project model.
"""

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.project import Project, ProjectStatus


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

async def get_project_by_id(db: AsyncSession, project_id: int) -> Optional[Project]:
    result = await db.execute(select(Project).where(Project.id == project_id))
    return result.scalar_one_or_none()


async def get_projects(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
    language: str = "en",
) -> Sequence[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.language == language)
        .order_by(Project.position.asc(), Project.id.asc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_all_projects(db: AsyncSession) -> Sequence[Project]:
    result = await db.execute(select(Project))
    return result.scalars().all()


async def get_next_position(db: AsyncSession) -> int:
    result = await db.execute(select(func.max(Project.position)))
    max_pos = result.scalar_one_or_none() or 0
    return max_pos + 1


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def create_project(
    db: AsyncSession,
    *,
    title: str,
    description: Optional[str] = None,
    link: str,
    image_object_name: Optional[str] = None,
    position: int = 0,
    owner_id: int,
    language: str = "en",
    health_check_urls: Optional[list] = None,
) -> Project:
    project = Project(
        title=title,
        description=description,
        link=link,
        image_object_name=image_object_name,
        position=position,
        owner_id=owner_id,
        language=language,
        health_check_urls=health_check_urls or [],
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

async def update_project(
    db: AsyncSession,
    project: Project,
    **kwargs,
) -> Project:
    valid_fields = {c.key for c in Project.__table__.columns}
    for key, value in kwargs.items():
        if key in valid_fields:
            setattr(project, key, value)
    await db.commit()
    await db.refresh(project)
    return project


async def set_project_status(
    db: AsyncSession,
    project: Project,
    status: ProjectStatus,
) -> Project:
    project.status = status
    project.last_checked = func.now()
    await db.commit()
    await db.refresh(project)
    return project


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def delete_project(db: AsyncSession, project: Project) -> None:
    await db.delete(project)
    await db.commit()
