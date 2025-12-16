from fastapi import HTTPException
from supabase.client import AuthApiError
from fastapi_app.database import db_client
from typing import Dict, Any

USER_PROFILES_TABLE = "profiles"

def signup_service(user):
    try:
        # 1. Tạo user trong Supabase Auth
        result = db_client.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "username": user.username or user.email.split("@")[0],
                    "avatar_url": None
                }
            }
        })

        if not result.user:
            raise HTTPException(status_code=400, detail="Signup failed. Please try again.")

        user_id = result.user.id
        username = result.user.user_metadata.get("username")

        # 2. Tạo bản ghi PROFILE mặc định
        db_client.table(USER_PROFILES_TABLE).insert({
            "id": user_id,
            "username": username,
            "avatar_url": None,
            "badge": 0,
            "last_login_date": None,
            "role": "user",
            "status": "active",
        }).execute()

        return {
            "id": user_id,
            "email": result.user.email,
            "username": username
        }

    except AuthApiError as e:
        raise HTTPException(status_code=400, detail=f"Auth error: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def login_service(user_data) -> Dict[str, Any]:
    """
    Xử lý đăng nhập, lấy token và truy vấn vai trò (role) từ Database.
    Trả về Dict khớp với TokenResponse schema (có user_id và user_role).
    """
    try:
        # 1. Đăng nhập Supabase Auth
        response = db_client.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })

        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id = response.user.id
        
        # 2. Truy vấn Role từ Database (BƯỚC SỬA LỖI)
        try:
            profile_response = db_client.from_(USER_PROFILES_TABLE).select("role").eq("id", user_id).single().execute()
            # Lấy role, mặc định là 'user' nếu không tìm thấy profile (Mặc dù nên tồn tại)
            user_role = profile_response.data.get("role", "user") 
        except Exception as db_err:
             # Nếu lỗi DB, giả định là user thường (hoặc xử lý lỗi chặt hơn)
             print(f"Warning: Could not fetch role for user {user_id}. Defaulting to 'user'. Error: {db_err}")
             user_role = "user"

        # 3. Trả về response HOÀN CHỈNH (Khớp với TokenResponse schema)
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user_id": user_id,      
            "user_role": user_role    
        }

    except AuthApiError as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {e}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


async def me_service(current_user):
    try:
        if hasattr(current_user, "id"):
            return {
                "id": current_user.id,
                "email": getattr(current_user, "email", None),
                "username": getattr(current_user, "user_metadata", {}).get("username", None)
            }

        elif isinstance(current_user, dict):
            return {
                "id": current_user.get("id"),
                "email": current_user.get("email"),
                "username": current_user.get("user_metadata", {}).get("username")
            }

        return {"id": None, "email": None, "username": None}

    except:
        return {"id": None, "email": None, "username": None}