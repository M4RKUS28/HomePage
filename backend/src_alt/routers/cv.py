# backend/src/routers/cv.py (updated with image upload endpoint)
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
import os
from datetime import datetime

from ..schemas import cv as cv_schemas
from ..models import db_cv as cv_model
from ..models import db_user as user_model
from ..models import db_project as project_model
from ..utils import auth
from ..db.database import get_db


import logging

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
        db_cv.data = cv_data.model_dump() # type: ignore
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


@router.post("/upload-image", status_code=status.HTTP_200_OK)
async def upload_image(
    image_data: cv_schemas.ImageUpload,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user)
):
    """
    Upload an image and store it directly in the database.
    """
    if image_data.image_type == "project":
        if not image_data.project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project ID is required for project images"
            )
            
        # First, check if this project exists in the actual projects table
        db_project = db.query(project_model.Project).filter(project_model.Project.id == image_data.project_id).first()
        if not db_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Project with ID {image_data.project_id} not found"
            )
            
        # Update the project's image in the projects table
        db_project.image = image_data.image_data
        db.commit()
        db.refresh(db_project)
        
        # Also update the project in CV data if it exists there
        #db_cv = db.query(cv_model.CV).first()
        #if db_cv:
        #    try:
        #        cv_data = db_cv.data
        #        projects = cv_data.get("projectsHighlight", [])
        #         
        #        project_updated = False
        #        for project in projects:
        #            if project.get("id") == image_data.project_id:
        #                project["image"] = image_data.image_data
        #                project_updated = True
        #                break
        #                
        #        if project_updated:
        #            db_cv.data = cv_data
        #            db.commit()
        #            db.refresh(db_cv)
        #    except Exception as e:
        #        # Log error but don't fail - the image is already saved to the project
        #        logging.error(f"Failed to update project image in CV data: {e}")
                
        return {
            "success": True, 
            "image_type": "project", 
            "project_id": image_data.project_id
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {image_data.image_type}"
        )