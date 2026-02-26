"""User management endpoints."""

from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.dependencies import get_current_active_user, get_current_admin_user, get_db
from ...db.models.user import User
from ...services import user as user_service
from ..schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _user_to_read(user: User) -> dict:
    """Convert a User model to a UserRead-compatible dict with avatar URL."""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "avatar_url": user_service.get_avatar_url(user),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserRead)
async def read_current_user(
    current_user: User = Depends(get_current_active_user),
):
    return _user_to_read(current_user)


@router.get("/", response_model=List[UserRead], dependencies=[Depends(get_current_admin_user)])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    users = await user_service.list_users(db, skip=skip, limit=limit)
    return [_user_to_read(u) for u in users]


@router.get("/{user_id}", response_model=UserRead)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from fastapi import HTTPException

    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised to access this user")
    user = await user_service.get_user(db, user_id)
    return _user_to_read(user)


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user = await user_service.update_user(db, user_id, data, current_user)
    return _user_to_read(user)


@router.delete(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(get_current_admin_user)],
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    user_data = await user_service.get_user(db, user_id)
    result = _user_to_read(user_data)
    await user_service.delete_user(db, user_id, current_user)
    return result


@router.delete("/me/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_own_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await user_service.delete_own_account(db, current_user)


@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    file_data = await file.read()
    user = await user_service.upload_avatar(db, current_user, file_data, file.content_type)
    return _user_to_read(user)


@router.get("/{user_id}/avatar")
async def get_user_avatar(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Redirect to presigned MinIO URL for the user's avatar."""
    from fastapi import HTTPException
    from fastapi.responses import RedirectResponse

    user = await user_service.get_user(db, user_id)
    url = user_service.get_avatar_url(user)
    if url is None:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return RedirectResponse(url=url, status_code=307)
