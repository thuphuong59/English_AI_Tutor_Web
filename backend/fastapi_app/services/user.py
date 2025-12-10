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
        # --- LẤY PROFILE ---
        try:
            db_user_res = (
                admin_supabase.table("profiles")
                .select("*")
                .eq("id", current_user.id)
                .single()
                .execute()
            )
            profile_data = db_user_res.data or {}
        except Exception:
            # Không có profile → profile mới → trả mặc định
            profile_data = {}

        # --- LẤY ROADMAP ---
        try:
            db_roadmap_res = (
                admin_supabase.table("roadmaps")
                .select("level, data")
                .eq("user_id", current_user.id)
                .order("created_at", desc=True)
                .limit(1)
                .single()
                .execute()
            )
            roadmap_row = db_roadmap_res.data or {}
        except Exception:
            roadmap_row = {}

        # Nếu không có roadmap → trả mặc định
        if not roadmap_row:
            return {
                "id": current_user.id,
                "email": current_user.email,
                "username": profile_data.get("username", "Người dùng"),
                "avatar_url": profile_data.get("avatar_url"),
                "level": "Chưa có",
                "current_goal": "Chưa có",
                "current_duration": "Chưa có",
                "learner_type": "Beginner Learner",
            }

        roadmap_content = roadmap_row.get("data", {}) or {}
        raw_status = roadmap_content.get("current_status", "")

        goal = "Chưa xác định"
        duration = "Chưa rõ"

        if "•" in raw_status:
            parts = raw_status.split("•")
            if len(parts) >= 2:
                goal = parts[0].replace("Mục tiêu:", "").strip()
                duration = parts[1].replace("Thời gian mong muốn:", "").strip()

        return {
            "id": current_user.id,
            "email": current_user.email,
            "username": profile_data.get("username", "Người dùng"),
            "avatar_url": profile_data.get("avatar_url"),
            "level": roadmap_row.get("level", "Chưa xác định"),
            "current_goal": goal,
            "current_duration": duration,
            "learner_type": (
                "Intermediate Learner"
                if "B1" in str(roadmap_row.get("level", ""))
                else "Beginner Learner"
            )
        }

    except Exception as e:
        print("LỖI HÀM GET_PROFILE:", e)
        raise HTTPException(status_code=400, detail=str(e))
def get_user_level(user_id: str) -> str:
    """Truy vấn Supabase để lấy Level của người dùng từ bảng roadmaps."""
    try:
        # GIẢ ĐỊNH: Bảng 'roadmaps' có cột 'user_id' và cột 'current_level' (hoặc 'level')
        response = admin_supabase.table("roadmaps") \
            .select("level") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        # Trả về Level (ví dụ: 'A2', 'B1') hoặc 'B1' nếu không tìm thấy
        user_level = response.data.get("level", "B1") 
        return user_level
        
    except Exception as e:
        # Ghi log lỗi và trả về level mặc định
        print(f"Error fetching user level from roadmaps: {e}")
        return "B1" # Default level nếu xảy ra lỗi truy vấn