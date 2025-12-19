from fastapi import HTTPException
from supabase.client import AuthApiError
from fastapi_app.database import db_client
from typing import Dict, Any
from datetime import datetime, date, timezone

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

from datetime import datetime, date, timezone

def normalize_date(value):
    if not value:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    try:
        # Parse chuỗi ISO từ Supabase (vd: 2025-12-19T...)
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).date()
    except:
        return None

async def login_service(user_data) -> Dict[str, Any]:
    try:
        # 1. Đăng nhập Supabase Auth
        response = db_client.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })

        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id = response.user.id
        today = date.today()
        
        # 2. Truy vấn Profile để lấy Badge và Last Login
        user_role = "user"
        new_badge = 1
        message = None
        message_type = None   
        try:
            profile_res = db_client.table(USER_PROFILES_TABLE).select("*").eq("id", user_id).single().execute()
            profile = profile_res.data
            if profile:
                user_role = profile.get("role", "user")
                last_login_raw = profile.get("last_login_date")
                current_badge = profile.get("badge", 0)
                
                last_login_date = normalize_date(last_login_raw)
                
                if last_login_date:
                    delta = (today - last_login_date).days
                    if delta == 1:
                        # Đăng nhập liên tiếp -> Tăng badge
                        new_badge = current_badge + 1
                        message_type = "success"
                        message = f"🎉 Congratulations! You’ve logged in consecutively and your badge has leveled up {new_badge}!"
                    elif delta == 0:
                        # Đăng nhập lại trong cùng ngày -> Giữ nguyên badge
                        new_badge = current_badge                      
                    else:
                        # Nghỉ quá 1 ngày -> Reset về 1
                        new_badge = 1
                        message_type = "warning"
                        message = f"You've lost your consecutive login streak. Your badge has been reset to 1."
                else:
                    # Lần đầu đăng nhập sau khi signup
                    new_badge = 1

                # 3. Cập nhật thông tin mới vào Database
                db_client.table(USER_PROFILES_TABLE).update({
                    "badge": new_badge,
                    "last_login_date": today.isoformat(),
                }).eq("id", user_id).execute()

        except Exception as db_err:
            print(f"Profile error: {db_err}")

        # 4. Trả về response HOÀN CHỈNH
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user_id": user_id,      
            "user_role": user_role,
            "badge": new_badge,
            "message": message,        # Thêm dòng này
            "message_type": message_type# Trả thêm badge để frontend hiển thị lời chúc
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