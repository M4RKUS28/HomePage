"""
Project service - business logic for project management.

Orchestrates: CRUD, health-checking, MinIO image handling.
"""

import asyncio
import logging
import re
from typing import Optional, Sequence

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.schemas.project import ProjectCreate, ProjectUpdate
from ..core.config import get_settings
from ..db.crud import project as project_crud
from ..db.minio import get_minio
from ..db.models.project import Project, ProjectStatus
from . import translation as translation_service

logger = logging.getLogger(__name__)
settings = get_settings()

# Max README size to pass to Gemini (100 KB)
_MAX_README_SIZE = 100 * 1024

# ---------------------------------------------------------------------------
# GitHub README import
# ---------------------------------------------------------------------------

def _to_raw_github_url(url: str) -> str:
    """Convert any GitHub URL variant to a raw content URL for fetching."""
    # Already a raw URL
    if "raw.githubusercontent.com" in url:
        return url
    # Blob URL: github.com/user/repo/blob/branch/path
    blob_match = re.match(
        r"https?://github\.com/([^/]+/[^/]+)/blob/(.+)", url
    )
    if blob_match:
        return f"https://raw.githubusercontent.com/{blob_match.group(1)}/{blob_match.group(2)}"
    # Repo root URL: try to fetch the default README
    repo_match = re.match(r"https?://github\.com/([^/]+/[^/?#]+)", url)
    if repo_match:
        repo = repo_match.group(1).rstrip("/")
        # Return sentinel; caller will try several branch/filename combos
        return f"__repo__{repo}"
    return url


async def _fetch_readme(github_url: str) -> tuple[str, str]:
    """Fetch README content from a GitHub URL.

    Returns (readme_text, canonical_repo_url).
    Raises HTTPException on failure.
    """
    raw_url = _to_raw_github_url(github_url.strip())

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        if raw_url.startswith("__repo__"):
            repo = raw_url[len("__repo__"):]
            canonical_url = f"https://github.com/{repo}"
            for branch in ("main", "master"):
                for filename in ("README.md", "readme.md", "README.rst", "README.txt"):
                    try_url = f"https://raw.githubusercontent.com/{repo}/{branch}/{filename}"
                    try:
                        resp = await client.get(try_url)
                        if resp.status_code == 200:
                            content = resp.text
                            if len(content.encode()) > _MAX_README_SIZE:
                                content = content[: _MAX_README_SIZE]
                            return content, canonical_url
                    except httpx.RequestError:
                        continue
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not find a README for this repository. Try pasting the direct README link.",
            )
        else:
            # Determine canonical repo URL from raw URL
            raw_repo_match = re.match(
                r"https?://raw\.githubusercontent\.com/([^/]+/[^/]+)/", raw_url
            )
            canonical_url = (
                f"https://github.com/{raw_repo_match.group(1)}"
                if raw_repo_match
                else github_url
            )
            try:
                resp = await client.get(raw_url)
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch README: {exc}",
                )
            if resp.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="README not found at that URL. Check the link and try again.",
                )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"GitHub returned HTTP {resp.status_code} when fetching the README.",
                )
            content = resp.text
            if len(content.encode()) > _MAX_README_SIZE:
                content = content[: _MAX_README_SIZE]
            return content, canonical_url


async def import_project_from_github(
    db,
    *,
    github_url: str,
    language: str = "en",
) -> dict:
    """Fetch a GitHub README and extract project metadata via Gemini.

    Returns a dict with: title, description, github_link, image_url, website_url.
    The result is NOT persisted - the caller (admin UI) reviews it before saving.
    """
    if not settings.gemini.api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI project import is not configured (missing Gemini API key).",
        )

    readme_content, canonical_url = await _fetch_readme(github_url)

    model = await translation_service.get_active_model(db)

    try:
        extracted = await translation_service.generate_project_from_readme(
            readme_content=readme_content,
            github_url=canonical_url,
            model=model,
            language=language,
        )
    except Exception as exc:
        logger.error("[project] GitHub README AI import failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to process the README with AI. Please try again.",
        )

    # Ensure required keys exist with safe defaults
    return {
        "title": extracted.get("title", ""),
        "description": extracted.get("description", ""),
        "github_link": extracted.get("github_link", canonical_url),
        "image_url": extracted.get("image_url", "") or "",
        "website_url": extracted.get("website_url", "") or "",
    }


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
    language: str = "en",
) -> Sequence[Project]:
    return await project_crud.get_projects(db, skip=skip, limit=limit, language=language)


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
        language=data.language,
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

    Raises HTTP 409 if another language has pending (untranslated) changes.
    """
    project = await get_project(db, project_id)

    # Conflict check: reject if another language of THIS PROJECT has pending changes
    has_conflict = await project_crud.check_pending_changes_other_language(
        db,
        translation_group_id=project.translation_group_id,
        exclude_language=project.language,
    )
    if has_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot update project for '{project.language}': another language version "
                "of this project has pending changes that must be translated first. "
                "Please wait for the automatic translation to complete."
            ),
        )

    changes = data.model_dump(exclude_unset=True)
    link_changed = False

    if "link" in changes and changes["link"] is not None:
        new_link = str(changes["link"])
        if project.link != new_link:
            link_changed = True
        changes["link"] = new_link

    if "health_check_urls" in changes:
        changes["health_check_urls"] = changes["health_check_urls"] or []

    # Mark as changed for translation
    changes["has_changes"] = True

    updated = await project_crud.update_project(db, project, **changes)
    return updated, link_changed


async def delete_project(db: AsyncSession, project_id: int) -> None:
    project = await get_project(db, project_id)
    
    # Fetch all projects in the same translation group to cascade delete
    group_id = project.translation_group_id
    if group_id:
        from sqlalchemy import select
        result = await db.execute(
            select(Project).where(Project.translation_group_id == group_id)
        )
        all_projects_in_group = result.scalars().all()
    else:
        # Fallback if for some reason group_id is missing
        all_projects_in_group = [project]

    # Clean up image from MinIO for all projects in the group
    minio_client = get_minio()
    for p in all_projects_in_group:
        if p.image_object_name:
            minio_client.delete_file(p.image_object_name)

    if group_id:
        await project_crud.delete_projects_by_group(db, group_id)
    else:
        # Fallback deletion
        await db.delete(project)
        await db.commit()


def get_project_image_url(project: Project) -> Optional[str]:
    """Generate presigned download URL for the project image."""
    if not project.image_object_name:
        return None
    return get_minio().presigned_get_url(project.image_object_name)
