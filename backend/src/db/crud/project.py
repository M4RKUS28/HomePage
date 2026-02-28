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


async def get_projects_with_changes(db: AsyncSession) -> Sequence[Project]:
    """Return all projects where has_changes is True."""
    result = await db.execute(select(Project).where(Project.has_changes == True))  # noqa: E712
    return result.scalars().all()


async def check_pending_changes_other_language(
    db: AsyncSession, *, exclude_language: str
) -> bool:
    """Check if any project in a DIFFERENT language has pending changes."""
    result = await db.execute(
        select(Project.id)
        .where(Project.language != exclude_language, Project.has_changes == True)  # noqa: E712
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def get_project_by_group_and_language(
    db: AsyncSession, group_id: int, language: str
) -> Optional[Project]:
    """Find a project by its translation_group_id and language."""
    result = await db.execute(
        select(Project).where(
            Project.translation_group_id == group_id,
            Project.language == language,
        )
    )
    return result.scalar_one_or_none()


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
    translation_group_id: Optional[int] = None,
    has_changes: bool = True,
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
        has_changes=has_changes,
    )
    db.add(project)
    await db.flush()  # get the ID before commit

    # Auto-assign translation_group_id (self-reference for new projects)
    project.translation_group_id = translation_group_id or project.id

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

async def delete_projects_by_group(db: AsyncSession, translation_group_id: int) -> None:
    """Delete all projects (in all languages) that share the given translation_group_id."""
    from sqlalchemy import delete
    await db.execute(
        delete(Project).where(Project.translation_group_id == translation_group_id)
    )
    await db.commit()
