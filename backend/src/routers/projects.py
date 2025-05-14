from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import httpx # For checking website status
import asyncio
from sqlalchemy.sql import func


from ..schemas import project as project_schemas
from ..models import db_project as project_model
from ..models import db_user as user_model # For current_user type hint
from ..utils import auth
from ..db.database import get_db
from ..config.settings import logging # Use configured logger

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)

async def check_website_status(url: str) -> project_model.ProjectStatus:
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            # Consider any 2xx or 3xx status as "up"
            if 200 <= response.status_code < 400:
                return project_model.ProjectStatus.UP
            else:
                logging.warning(f"Status check for {url} failed with status: {response.status_code}")
                return project_model.ProjectStatus.DOWN
    except httpx.RequestError as e:
        logging.error(f"Error checking {url}: {e}")
        return project_model.ProjectStatus.DOWN
    except Exception as e:
        logging.error(f"Unexpected error checking {url}: {e}")
        return project_model.ProjectStatus.UNKNOWN


async def update_project_status_task(project_id: int, db: Session):
    """Background task to update a single project's status."""
    db_project = db.query(project_model.Project).filter(project_model.Project.id == project_id).first()
    if db_project:
        logging.info(f"Background task: Checking status for project ID {project_id} - {db_project.link}")
        db_project.status = project_model.ProjectStatus.CHECKING # Mark as checking
        db.commit()
        
        new_status = await check_website_status(str(db_project.link)) # Convert HttpUrl to str
        
        # Re-fetch to avoid race conditions if other parts of the app modify it, though less likely here
        db.refresh(db_project) 
        db_project.status = new_status
        db_project.last_checked = func.now() # Use func.now() for database-side timestamp
        db.commit()
        db.refresh(db_project)
        logging.info(f"Background task: Updated status for project ID {project_id} to {new_status}")
    else:
        logging.warning(f"Background task: Project ID {project_id} not found for status update.")


@router.post("/", response_model=project_schemas.Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: project_schemas.ProjectCreate, # project contains Pydantic HttpUrl types
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    project_data = project.model_dump() # Get a dictionary from the Pydantic model

    # Convert HttpUrl fields to strings before creating the SQLAlchemy model
    db_project = project_model.Project(
        title=project_data.get("title"),
        description=project_data.get("description"),
        link=str(project_data.get("link")) if project_data.get("link") else None, # Convert link to str
        image_url=str(project_data.get("image_url")) if project_data.get("image_url") else None, # Convert image_url to str
        owner_id=current_user.id
        # status will default in the model or be set by background task
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    background_tasks.add_task(update_project_status_task, db_project.id, db)
    return db_project

@router.get("/", response_model=List[project_schemas.Project])
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    projects = db.query(project_model.Project).order_by(project_model.Project.id.desc()).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=project_schemas.Project)
async def read_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(project_model.Project).filter(project_model.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return db_project

@router.post("/{project_id}/check-status", response_model=project_schemas.Project)
async def trigger_project_status_check(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user) # Or any active user if you prefer
):
    db_project = db.query(project_model.Project).filter(project_model.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    background_tasks.add_task(update_project_status_task, project_id, db)
    # Return the project with its current (possibly 'checking') status
    # The actual update happens in the background
    db.refresh(db_project) # Get the latest state, which might include "checking"
    return db_project


@router.put("/{project_id}", response_model=project_schemas.Project)
async def update_project(
    project_id: int,
    project_update: project_schemas.ProjectUpdate, # project_update contains Pydantic HttpUrl types
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    db_project = db.query(project_model.Project).filter(project_model.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = project_update.model_dump(exclude_unset=True)
    link_changed = False

    for key, value in update_data.items():
        if key == "link" and value is not None:
            if db_project.link != str(value): # Compare string form
                link_changed = True
            setattr(db_project, key, str(value)) # Store as string
        elif key == "image_url" and value is not None:
            setattr(db_project, key, str(value)) # Store as string
        elif value is not None: # For other fields or if value is None (to clear optional fields)
             setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    
    if link_changed or ("status" not in update_data and db_project.status == project_model.ProjectStatus.UNKNOWN):
        background_tasks.add_task(update_project_status_task, db_project.id, db)

    return db_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    db_project = db.query(project_model.Project).filter(project_model.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Optional: Check if current_user is the owner or if only superadmins can delete
    # if db_project.owner_id != current_user.id and not current_user.is_superadmin: # Assuming a superadmin concept
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this project")

    db.delete(db_project)
    db.commit()
    return None # For 204 No Content

# --- Periodic Status Checking ---
# This is a simple way to trigger checks for all projects.
# For "every minute", a more robust solution like APScheduler or Celery is recommended.
# This endpoint can be called by an external cron job or a simple scheduled task.
async def update_all_projects_status(db: Session = Depends(get_db)):
    projects = db.query(project_model.Project).all()
    tasks = []
    logging.info(f"Scheduler: Starting status check for {len(projects)} projects.")
    for project in projects:
        # Create a new session for each task if using a more complex async setup
        # or ensure the session `db` is handled correctly by background_tasks
        tasks.append(update_project_status_task(project.id, db)) 
    await asyncio.gather(*tasks)
    logging.info("Scheduler: Finished all project status checks.")
    return {"message": "All project status checks initiated."}

# Example of how you might integrate with APScheduler (simplified)
# from apscheduler.schedulers.asyncio import AsyncIOScheduler
# scheduler = AsyncIOScheduler()

# @router.on_event("startup") # This will be in main.py
# async def startup_scheduler():
#     db_gen = get_db() # Get a generator
#     db = next(db_gen) # Get a session
#     try:
#         # Add job to scheduler. Run every 60 seconds.
#         # Pass a new DB session for each job execution to avoid session issues.
#         scheduler.add_job(
#             lambda: asyncio.create_task(update_all_projects_status(next(get_db()))),
#             'interval',
#             seconds=60, # Check every minute
#             id="update_all_projects_job",
#             replace_existing=True
#         )
#         scheduler.start()
#         logging.info("APScheduler started for project status checks.")
#     finally:
#         db.close() # Close the session used for setup

# @router.on_event("shutdown") # This will be in main.py
# async def shutdown_scheduler():
#     if scheduler.running:
#         scheduler.shutdown()
#         logging.info("APScheduler shut down.")