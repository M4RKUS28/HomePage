# backend/src/routers/cv.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..schemas import cv as cv_schemas
from ..models import db_cv as cv_model
from ..models import db_user as user_model
from ..utils import auth
from ..db.database import get_db

router = APIRouter(
    prefix="/cv",
    tags=["cv"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=cv_schemas.CVData)
async def read_cv_data(
    db: Session = Depends(get_db)
):
    """
    Get CV data. This is public information that doesn't require authentication.
    """
    # Get the first CV entry (assuming there's only one in the system)
    db_cv = db.query(cv_model.CV).first()
    
    if not db_cv:
        # If no CV data exists, return default empty data
        return cv_schemas.CVData()
    
    return db_cv.data

@router.put("/", response_model=cv_schemas.CVData)
async def update_cv_data(
    cv_data: cv_schemas.CVData,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    """
    Update CV data. Only accessible by admin users.
    """
    # Check if CV data exists
    db_cv = db.query(cv_model.CV).first()
    
    if db_cv:
        # Update existing CV data
        db_cv.data = cv_data.model_dump()
        db_cv.owner_id = current_user.id
    else:
        # Create new CV data
        db_cv = cv_model.CV(
            data=cv_data.model_dump(),
            owner_id=current_user.id
        )
        db.add(db_cv)
    
    db.commit()
    db.refresh(db_cv)
    return db_cv.data

@router.get("/site-config", response_model=cv_schemas.SiteConfig)
async def read_site_config(
    db: Session = Depends(get_db)
):
    """
    Get site configuration. This is public information.
    """
    # Get the first site config entry
    db_config = db.query(cv_model.SiteConfig).first()
    
    if not db_config:
        # If no config exists, return 404
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site configuration not found")
    
    return db_config

@router.put("/site-config", response_model=cv_schemas.SiteConfig)
async def update_site_config(
    config: cv_schemas.SiteConfigUpdate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    """
    Update site configuration. Only accessible by admin users.
    """
    # Check if site config exists
    db_config = db.query(cv_model.SiteConfig).first()
    
    if db_config:
        # Update existing config
        config_data = config.model_dump(exclude_unset=True)
        for key, value in config_data.items():
            setattr(db_config, key, value)
        db_config.owner_id = current_user.id
    else:
        # Create new config
        config_dict = config.model_dump()
        config_dict["owner_id"] = current_user.id
        db_config = cv_model.SiteConfig(**config_dict)
        db.add(db_config)
    
    db.commit()
    db.refresh(db_config)
    return db_config