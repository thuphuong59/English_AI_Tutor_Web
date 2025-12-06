from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi_app.database import db_client
from supabase.client import AuthApiError

# Dùng OAuth2 Bearer để trích xuất token từ header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    """
     Middleware xác thực người dùng hiện tại bằng Bearer token.
    - Giải mã token qua Supabase để lấy thông tin user.
    - Nếu token không hợp lệ hoặc hết hạn, trả về 401.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Lấy thông tin user từ token
        response = db_client.auth.get_user(token)
        user = getattr(response, "user", None)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unauthorized: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """
    HÀM MỚI (Số 2): Chỉ trả về user_id (dạng string).
    Dùng cho router /vocabulary.
    """
    # Tái sử dụng hàm ở trên để lấy object
    user_object = get_current_user(token) 
    
    # Chỉ trả về ID từ object
    return user_object.id      