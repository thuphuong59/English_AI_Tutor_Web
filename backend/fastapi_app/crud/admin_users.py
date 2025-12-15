from typing import List, Dict, Any, Optional
from postgrest.base_request_builder import SingleAPIResponse
from ..schemas.admin import AdminUserUpdate, UpdateUserStatus, UpdateUserRole 

# Tên bảng chính xác trong Supabase
USER_PROFILES_TABLE = 'profiles' 

def get_all_user_details(db: Any, search_query: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        # 1. Bắt đầu query cơ bản
        query = db.from_(USER_PROFILES_TABLE).select(
            "id, username, avatar_url, updated_at, badge, last_login_date, role, status"
        )
        
        # 2. Nếu có từ khóa tìm kiếm -> Thêm bộ lọc
        if search_query:
            # Tìm kiếm theo username (không phân biệt hoa thường - ilike)
            # Hoặc tìm theo ID (nếu khớp chính xác)
            # Cú pháp Supabase: or=(col1.ilike.val,col2.eq.val)
            # Ở đây ta ưu tiên tìm theo username cho đơn giản và hiệu quả
            query = query.ilike("username", f"%{search_query}%")
            
        # 3. Thực thi
        response = query.execute()
        user_data = response.data
        
        # 4. Lấy session count (Logic giữ nguyên)
        for user in user_data:
            session_resp = db.from_('conversation_sessions').select('*', count='exact').eq("user_id", user['id']).execute()
            user['session_count'] = session_resp.count if session_resp.count is not None else 0
            
        return user_data
    except Exception as e:
        print(f"DB Error (get_all_user_details): {e}")
        return []

def update_user_status_in_db(db: Any, user_id: str, new_status: UpdateUserStatus) -> SingleAPIResponse:
    if new_status.status not in ["active", "blocked"]:
        raise ValueError("Invalid status value.")
    return db.from_(USER_PROFILES_TABLE).update({'status': new_status.status}).eq('id', user_id).execute()

def update_user_role_in_db(db: Any, user_id: str, new_role: UpdateUserRole) -> SingleAPIResponse:
    if new_role.role not in ["admin", "user"]:
        raise ValueError("Invalid role value.")
    return db.from_(USER_PROFILES_TABLE).update({'role': new_role.role}).eq('id', user_id).execute()

def get_user_by_id(db: Any, user_id: str) -> Dict[str, Any]:
    try:
        response = db.from_(USER_PROFILES_TABLE).select(
            "id, username, updated_at, badge, last_login_date, role, status"
        ).eq("id", user_id).single().execute()
        
        user = response.data
        if user:
            # Lấy thêm session count
            session_resp = db.from_('conversation_sessions').select('*', count='exact').eq("user_id", user_id).execute()
            user['session_count'] = session_resp.count if session_resp.count is not None else 0
            
        return user
    except Exception as e:
        print(f"DB Error (get_user_by_id): {e}")
        return None

def delete_user_in_db(db: Any, user_id: str) -> bool:
    """
    Xóa người dùng và toàn bộ dữ liệu liên quan (Sessions, Messages).
    """
    try:
        print(f"Attempting to delete user: {user_id}")

        # BƯỚC 1: Xóa Conversation Sessions trước (Dữ liệu con)
        # (Messages thường được cài đặt ON DELETE CASCADE theo Session, 
        # nên xóa Session là Messages tự bay màu. Nếu không, phải xóa Messages trước Session)
        delete_session_resp = db.from_('conversation_sessions').delete().eq("user_id", user_id).execute()
        print(f"Deleted sessions data: {delete_session_resp.data}")

        # BƯỚC 2: Xóa Profile (Dữ liệu cha)
        response = db.from_(USER_PROFILES_TABLE).delete().eq("id", user_id).execute()
        
        # Kiểm tra xem có xóa được dòng nào không
        if response.data:
            print(f"Successfully deleted user profile: {user_id}")
            return True
            
        print(f"Failed to delete user profile (User not found or RLS blocked): {user_id}")
        return False

    except Exception as e:
        print(f"DB Error (delete_user_in_db): {e}")
        # In chi tiết lỗi để debug
        if hasattr(e, 'message'):
            print(f"Error Message: {e.message}")
        if hasattr(e, 'code'):
            print(f"Error Code: {e.code}")
        return False
    
# 3. Lấy danh sách sessions (cho trang chi tiết)
def get_user_sessions(db: Any, user_id: str) -> List[Dict[str, Any]]:
    try:
        response = db.from_('conversation_sessions')\
            .select("id, topic, created_at")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True) \
            .execute() 
            # SỬA: Đổi 'ascending=False' thành 'desc=True'
            
        return response.data
    except Exception as e:
        print(f"DB Error (get_user_sessions): {e}")
        return []

# 4. Lấy chi tiết Messages của Session (Cũng cần sửa nếu bạn đã thêm hàm này)
def get_session_messages(db: Any, session_id: str) -> List[Dict[str, Any]]:
    try:
        response = db.from_('session_messages')\
            .select("role, text, type, metadata, timestamp")\
            .eq("session_id", session_id)\
            .order("timestamp", desc=False)\
            .execute()
            # SỬA: 'ascending=True' thành 'desc=False' (hoặc bỏ order nếu mặc định)
            
        return response.data
    except Exception as e:
        print(f"DB Error (get_session_messages): {e}")
        return []

# 5. Lấy Overview của Session
def get_session_overview(db: Any, session_id: str) -> Dict[str, Any]:
    try:
        response = db.from_('conversation_sessions')\
            .select("id, topic, created_at, user_id")\
            .eq("id", session_id)\
            .single()\
            .execute()
        return response.data
    except Exception as e:
        return None
    
def update_user_in_db(db: Any, user_id: str, update_data: AdminUserUpdate) -> Dict[str, Any]:
    try:
        # 1. Chuyển Pydantic model thành dict và loại bỏ các trường None (không gửi lên)
        data_to_update = update_data.model_dump(exclude_unset=True)
        
        if not data_to_update:
            return None # Không có gì để update

        # 2. Thực hiện Update vào bảng profiles
        response = db.from_(USER_PROFILES_TABLE)\
            .update(data_to_update)\
            .eq("id", user_id)\
            .execute()
            
        # Trả về dữ liệu sau khi update (nếu thành công)
        if response.data:
            return response.data[0]
        return None
        
    except Exception as e:
        print(f"DB Error (update_user_in_db): {e}")
        raise e