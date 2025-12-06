from fastapi import APIRouter, Depends, File, UploadFile, Form
from fastapi_app.dependencies import get_current_user
from fastapi_app.schemas import ChangePasswordRequest
from fastapi_app.services.user import (
    upload_avatar_service,
    update_profile_service,
    change_password_service,
    get_profile_service
)

router = APIRouter(prefix="/user", tags=["User Settings"])


@router.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    return await upload_avatar_service(file, current_user)


@router.put("/update-profile")
async def update_profile(
    username: str = Form(...),
    avatar_url: str = Form(...),
    current_user=Depends(get_current_user)
):
    return await update_profile_service(username, avatar_url, current_user)


@router.put("/change-password")
async def change_password(request: ChangePasswordRequest, current_user=Depends(get_current_user)):
    return await change_password_service(request, current_user)


@router.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    return await get_profile_service(current_user)
