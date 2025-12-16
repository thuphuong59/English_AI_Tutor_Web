from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase.client import AuthApiError


# Dùng OAuth2 Bearer để trích xuất token từ header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

from fastapi_app.database import db_client 


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
        # Lưu ý: get_user() trả về một đối tượng có thuộc tính .user
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

def get_current_user_id(user=Depends(get_current_user)) -> str:
    """
    Chỉ trả về user_id (dạng string) từ đối tượng user.
    """
    # Tái sử dụng hàm ở trên để lấy object
    # Thay đổi: Sử dụng user object trực tiếp từ Depends(get_current_user)
    return user.id 


def get_admin_user_id(user=Depends(get_current_user)) -> str:
    """
    Xác thực user và kiểm tra vai trò 'admin' trong Database qua cột 'role' mới.
    """
    user_id = user.id
    
    try:
        # Tên bảng bạn cung cấp
        USER_PROFILES_TABLE = 'profiles' 
        
        # Kiểm tra cột 'role' mới
        response = db_client.from_(USER_PROFILES_TABLE).select("role").eq("id", user_id).single().execute()
        
        user_role = response.data.get("role")
        
        if user_role != "admin": # Kiểm tra vai trò là 'admin'
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Administrator role required.")
            
        return user_id
        
    except Exception as e:
        print(f"Admin check error for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. Failed to verify administrator role."
        )