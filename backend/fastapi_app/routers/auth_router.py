# from fastapi import APIRouter, Depends
# from fastapi_app.schemas.auth_schemas import UserCreate, UserLogin, UserResponse
# from fastapi_app.services.auth_service import signup_service, login_service
# # from fastapi_app.dependencies import get_current_user

# router = APIRouter(prefix="/auth", tags=["Authentication"])


# @router.post("/signup", response_model=UserResponse)
# def signup(user: UserCreate):
#     """API đăng ký tài khoản."""
#     return signup_service(user)


# @router.post("/login")
# def login(user_data: UserLogin):
#     """API đăng nhập."""
#     return login_service(user_data)


# # @router.get("/me", response_model=UserResponse)
# # def me(current_user=Depends(get_current_user)):
# #     """API lấy thông tin người dùng hiện tại."""
# #     return me_service(current_user)
