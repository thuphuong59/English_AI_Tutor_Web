from fastapi import APIRouter, Depends
from fastapi_app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse # IMPORT SCHEMA MỚI
from fastapi_app.dependencies import get_current_user
from fastapi_app.services import auth as auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate):
    return auth.signup_service(user)

@router.post("/login", response_model=TokenResponse) 
async def login(user_data: UserLogin):
    # Nếu login_service trả về đúng cấu trúc, lỗi sẽ được khắc phục
    return await auth.login_service(user_data)

@router.get("/me", response_model=UserResponse)
async def me(current_user = Depends(get_current_user)):
    return await auth.me_service(current_user)