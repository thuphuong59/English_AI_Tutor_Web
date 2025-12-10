from fastapi import HTTPException
from supabase.client import AuthApiError
from fastapi_app.database import db_client

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
        db_client.table("profiles").insert({
            "id": user_id,
            "username": username,
            "avatar_url": None,
            "badge": 0,
            "last_login_date": None
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


async def login_service(user_data):
    try:
        response = db_client.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })

        if response.session:
            return {
                "access_token": response.session.access_token,
                "token_type": "bearer"
            }

        raise HTTPException(status_code=401, detail="Invalid credentials")

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
