# from fastapi import HTTPException, Depends
# from supabase import Client
# from supabase.client import AuthApiError
# from fastapi_app.database import supabase
# # from fastapi_app.dependencies import get_current_user
# from  fastapi_app.schemas.auth_schemas import UserCreate, UserLogin, UserResponse
# from datetime import datetime, date, timezone, timedelta

# def signup_service(user: UserCreate):
#     """Đăng ký tài khoản mới và tạo profile với badge mặc định = 1"""
#     try:
#         result = supabase.auth.sign_up({
#             "email": user.email,
#             "password": user.password,
#             "options": {
#                 "data": {"username": user.username or user.email.split("@")[0]}
#             }
#         })

#         if not result.user:
#             raise HTTPException(status_code=400, detail="Signup failed. Please try again.")

#         user_id = result.user.id

#         # ✅ Tạo profile mặc định cho user
#         supabase.table("profiles").insert({
#             "id": user_id,               # khóa chính, liên kết với auth.users.id
#             "badge": 1,                  # huy hiệu mặc định
#             "avatar_url": None,          # có thể để trống
#             "updated_at": datetime.now(timezone.utc).isoformat(),
#             "last_login_date": datetime.now(timezone.utc).isoformat()
#         }).execute()

#         print(f"[DEBUG] New user registered: {result.user.email} ({user.username})")

#         return {
#             "id": user_id,
#             "email": result.user.email,
#             "username": result.user.user_metadata.get("username"),
#         }

#     except AuthApiError as e:
#         print(f"[AUTH ERROR] {e}")
#         raise HTTPException(status_code=400, detail=f"Auth error: {e}")

#     except Exception as e:
#         print(f"[ERROR] Signup failed: {e}")
#         raise HTTPException(status_code=400, detail=str(e))


# def normalize_date(value):
#     """Chuẩn hóa giá trị ngày từ datetime hoặc chuỗi timestamptz → trả về date object."""
#     if not value:
#         return None

#     # Nếu là datetime object, chỉ lấy phần ngày
#     if isinstance(value, datetime):
#         return value.date()

#     # Nếu là string
#     try:
#         # Thử parse theo ISO format chuẩn (vd: 2025-10-31T07:43:32+00:00)
#         return datetime.fromisoformat(str(value)).date()
#     except Exception:
#         try:
#             # Thử parse dạng có khoảng trắng (vd: 2025-10-31 07:43:32+00)
#             clean_str = str(value).split(" ")[0]
#             return date.fromisoformat(clean_str)
#         except Exception as e:
#             print("[WARN] normalize_date() cannot parse:", value, e)
#             return None
# def login_service(user_data: UserLogin):
#     """Đăng nhập, tăng badge nếu user đăng nhập liên tiếp, và trả về session data."""
#     try:
#         response = supabase.auth.sign_in_with_password({
#             "email": user_data.email,
#             "password": user_data.password,
#         })
        
#         if response.user is None or response.session is None:
#             raise HTTPException(status_code=401, detail="Invalid credentials or session error")
            
#         user_id = response.user.id
        
#         # 🚨 CẤU TRÚC PHẢN HỒI CHO FRONTEND 🚨
#         result = {
#             # Dữ liệu quan trọng cho xác thực (Access Token)
#             "access_token": response.session.access_token,
#             "token_type": "bearer",
            
#             # Dữ liệu người dùng (Frontend cần lưu ID này)
#             "user": {
#                 "id": user_id, 
#                 "email": response.user.email,
#                 "username": response.user.user_metadata.get("username"),
#                 # 'badge' sẽ được thêm sau khi update
#             }
#         }
        
#         # --- LOGIC TÍNH CHUỖI ĐĂNG NHẬP VÀ CẬP NHẬT PROFILE ---
#         try:
#             profile_res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
#             profile = profile_res.data
            
#             message = None
#             message_type = None
#             new_badge = 1 # Giá trị mặc định
            
#             if profile:
#                 last_login_date = normalize_date(profile.get("last_login_date"))
#                 today = date.today()
#                 created_at = normalize_date(profile.get("created_at"))
                
#                 if last_login_date is not None and created_at != last_login_date:
#                     # Logic tăng/reset badge
#                     if (today - last_login_date).days == 1:
#                         new_badge = (profile.get("badge") or 1) + 1
#                         message_type = "success"
#                         message = f"🎉 Chúc mừng! Bạn đã đăng nhập liên tiếp và badge tăng lên {new_badge}!"
#                     elif (today - last_login_date).days > 1:
#                         new_badge = 1  # reset badge khi mất chuỗi
#                         message_type = "warning"
#                         message = f"Bạn đã mất chuỗi đăng nhập liên tiếp. Badge được đặt lại về {new_badge}."
#                     else:
#                         new_badge = profile.get("badge") or 1 # cùng ngày, không đổi
                
#                 # Cập nhật DB
#                 supabase.table("profiles").update({
#                     "badge": new_badge,
#                     "last_login_date": datetime.now(timezone.utc).isoformat(),
#                     "updated_at": datetime.now(timezone.utc).isoformat()
#                 }).eq("id", user_id).execute()

#                 result["user"]["badge"] = new_badge # Thêm badge vào phản hồi
                
#                 if message:
#                     result["message"] = message
#                     result["message_type"] = message_type
            
#         except Exception as e:
#             print("[ERROR] profile update failed (ignored):", e)
#             # Nếu update profile thất bại, vẫn trả về token và ID để người dùng có thể sử dụng
            
#         return result
        
#     except AuthApiError as e:
#         print("[AUTH ERROR]", e)
#         raise HTTPException(status_code=401, detail=f"Auth error: {e}")
        
#     except Exception as e:
#         print("[ERROR] Login failed:", e)
#         raise HTTPException(status_code=401, detail=str(e))
