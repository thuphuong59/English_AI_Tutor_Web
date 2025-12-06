from fastapi import HTTPException
from supabase.client import AuthApiError
from fastapi_app.database import db_client

def signup_service(user):
    try:
        result = db_client.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "username": user.username or user.email.split("@")[0],
                }
            }
        })

        if not result.user:
            raise HTTPException(status_code=400, detail="Signup failed. Please try again.")

        return {
            "id": result.user.id,
            "email": result.user.email,
            "username": result.user.user_metadata.get("username")
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
