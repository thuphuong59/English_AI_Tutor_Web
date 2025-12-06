# fastapi_app/user/user_service.py
import uuid
import datetime
from fastapi import HTTPException, UploadFile
from fastapi_app.database import db_client, admin_supabase

async def upload_avatar_service(file: UploadFile, current_user):
    try:
        file_ext = file.filename.split(".")[-1]
        file_path = f"avatars/{current_user.id}_{uuid.uuid4()}.{file_ext}"
        file_content = await file.read()

        res = admin_supabase.storage.from_("avatars").upload(
            file_path,
            file_content,
            {"content-type": file.content_type or "image/jpeg", "upsert": "true"}
        )

        if isinstance(res, dict) and res.get("error"):
            raise HTTPException(status_code=400, detail=f"Upload failed: {res['error'].get('message')}")

        public_url = admin_supabase.storage.from_("avatars").get_public_url(file_path)

        return {"message": "Avatar uploaded successfully", "avatar_url": public_url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def update_profile_service(username: str, avatar_url: str, current_user):
    try:
        admin_supabase.auth.admin.update_user_by_id(
            current_user.id,
            {"user_metadata": {"username": username, "avatar_url": avatar_url}}
        )

        admin_supabase.table("profiles").upsert({
            "id": current_user.id,
            "username": username,
            "avatar_url": avatar_url,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }).execute()

        return {"message": "Profile updated successfully", "username": username, "avatar_url": avatar_url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def change_password_service(request, current_user):
    try:
        auth_res = db_client.auth.sign_in_with_password({
            "email": current_user.email,
            "password": request.old_password
        })

        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Old password incorrect.")

        result = db_client.auth.update_user({"password": request.new_password})
        if not getattr(result, "user", None):
            raise HTTPException(status_code=400, detail="Password update failed.")

        return {"message": "Password changed successfully"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def get_profile_service(current_user):
    try:
        db_user = admin_supabase.table("profiles").select("*").eq("id", current_user.id).execute()
        meta = getattr(current_user, "user_metadata", {}) or {}

        return {
            "id": current_user.id,
            "email": current_user.email,
            "username": meta.get("username"),
            "avatar_url": meta.get("avatar_url"),
            "db_profile": db_user.data[0] if db_user.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
