"""Project management endpoints."""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.dependencies import get_current_admin_user, get_db
from ...db.models.user import User
from ...services import project as project_service
from ..schemas.project import ProjectCreate, ProjectListItem, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _project_to_read(project) -> dict:
    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "link": project.link,
        "image_url": project_service.get_project_image_url(project),
        "status": project.status,
        "last_checked": project.last_checked,
        "position": project.position,
        "owner_id": project.owner_id,
        "health_check_urls": project.health_check_urls or [],
    }


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[ProjectListItem])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """List projects (without image) for fast loading."""
    projects = await project_service.list_projects(db, skip=skip, limit=limit)
    return projects


@router.get("/{project_id}", response_model=ProjectRead)
async def read_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    project = await project_service.get_project(db, project_id)
    return _project_to_read(project)


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    project = await project_service.create_project(db, data, owner_id=current_user.id)
    # Trigger health check in background
    background_tasks.add_task(project_service.check_project_health, db, project)
    return _project_to_read(project)


@router.put("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    project, link_changed = await project_service.update_project(db, project_id, data)
    if link_changed:
        background_tasks.add_task(project_service.check_project_health, db, project)
    return _project_to_read(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    await project_service.delete_project(db, project_id)


@router.post("/{project_id}/check-status", response_model=ProjectRead)
async def trigger_health_check(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    project = await project_service.get_project(db, project_id)
    background_tasks.add_task(project_service.check_project_health, db, project)
    return _project_to_read(project)
