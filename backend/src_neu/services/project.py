"""
Project service – business logic for project management.

Orchestrates: CRUD, health-checking, MinIO image handling.
"""

import asyncio
import logging
from typing import Optional, Sequence

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.schemas.project import ProjectCreate, ProjectUpdate
from ..db.crud import project as project_crud
from ..db.minio import get_minio
from ..db.models.project import Project, ProjectStatus

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Health check helpers
# ---------------------------------------------------------------------------

async def _check_url(url: str) -> ProjectStatus:
    """Check a single URL and return UP / DOWN / UNKNOWN."""
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
            if 200 <= resp.status_code < 400:
                return ProjectStatus.UP
            logger.warning("Health check for %s: HTTP %s", url, resp.status_code)
            return ProjectStatus.DOWN
    except httpx.RequestError as exc:
        logger.error("Health check error for %s: %s", url, exc)
        return ProjectStatus.DOWN
    except Exception as exc:
        logger.error("Unexpected error checking %s: %s", url, exc)
        return ProjectStatus.UNKNOWN


async def check_project_health(db: AsyncSession, project: Project) -> Project:
    """
    Check the main link AND all health_check_urls concurrently.
    Project is UP only if ALL URLs are UP.
    """
    await project_crud.set_project_status(db, project, ProjectStatus.CHECKING)

    urls = [str(project.link)]
    urls.extend(u for u in (project.health_check_urls or []) if u and u.strip())

    statuses = await asyncio.gather(*[_check_url(u) for u in urls])
    logger.info("Health check results for project %d: %s", project.id, list(zip(urls, statuses)))

    if all(s == ProjectStatus.UP for s in statuses):
        new_status = ProjectStatus.UP
    elif any(s == ProjectStatus.DOWN for s in statuses):
        new_status = ProjectStatus.DOWN
    else:
        new_status = ProjectStatus.UNKNOWN

    return await project_crud.set_project_status(db, project, new_status)


async def check_all_projects_health(db: AsyncSession) -> None:
    """Run health checks for all projects (called by scheduler)."""
    projects = await project_crud.get_all_projects(db)
    logger.info("Scheduler: checking %d projects", len(projects))
    for project in projects:
        try:
            await check_project_health(db, project)
        except Exception as exc:
            logger.error("Health check failed for project %d: %s", project.id, exc)


# ---------------------------------------------------------------------------
# CRUD orchestration
# ---------------------------------------------------------------------------

async def list_projects(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> Sequence[Project]:
    return await project_crud.get_projects(db, skip=skip, limit=limit)


async def get_project(db: AsyncSession, project_id: int) -> Project:
    project = await project_crud.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def create_project(
    db: AsyncSession,
    data: ProjectCreate,
    owner_id: int,
) -> Project:
    position = data.position or await project_crud.get_next_position(db)
    project = await project_crud.create_project(
        db,
        title=data.title,
        description=data.description,
        link=str(data.link),
        position=position,
        owner_id=owner_id,
        health_check_urls=data.health_check_urls or [],
    )
    # Fire-and-forget health check (handled in router via BackgroundTasks)
    return project


async def update_project(
    db: AsyncSession,
    project_id: int,
    data: ProjectUpdate,
) -> tuple[Project, bool]:
    """
    Update a project. Returns ``(project, link_changed)`` so the router
    can decide whether to trigger a health check.
    """
    project = await get_project(db, project_id)
    changes = data.model_dump(exclude_unset=True)
    link_changed = False

    if "link" in changes and changes["link"] is not None:
        new_link = str(changes["link"])
        if project.link != new_link:
            link_changed = True
        changes["link"] = new_link

    if "health_check_urls" in changes:
        changes["health_check_urls"] = changes["health_check_urls"] or []

    updated = await project_crud.update_project(db, project, **changes)
    return updated, link_changed


async def delete_project(db: AsyncSession, project_id: int) -> None:
    project = await get_project(db, project_id)
    # Clean up image from MinIO
    if project.image_object_name:
        get_minio().delete_file(project.image_object_name)
    await project_crud.delete_project(db, project)


def get_project_image_url(project: Project) -> Optional[str]:
    """Generate presigned download URL for the project image."""
    if not project.image_object_name:
        return None
    return get_minio().presigned_get_url(project.image_object_name)
