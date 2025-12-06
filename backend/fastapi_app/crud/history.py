import json
from supabase import Client
from typing import List, Dict, Any
from datetime import datetime
import uuid

def get_sessions(db: Client, user_id: str):
    """Lấy danh sách các phiên hội thoại của user."""
    try:
        res = db.table("conversation_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"DB Error (get_sessions): {e}")
        raise

def get_session_details(db: Client, session_id: str):
    """Lấy chi tiết 1 session."""
    try:
        res = db.table("conversation_sessions").select("*").eq("id", session_id).single().execute()
        return res.data
    except Exception as e:
        print(f"DB Error (get_session_details): {e}")
        return None

def create_session(db: Client, mode: str, level: str, topic: str, user_id: str) -> Dict[str, Any]:
    """Tạo session mới."""
    new_session = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "mode": mode,
        "level": level,
        "topic": topic,
        "messages": [], # Init empty JSON array
        "created_at": datetime.utcnow().isoformat()
    }
    try:
        res = db.table("conversation_sessions").insert(new_session).execute()
        return res.data[0]
    except Exception as e:
        print(f"DB Error (create_session): {e}")
        raise

def append_message_to_history(db: Client, session_id: str, new_message: Dict[str, Any]):
    """Thêm tin nhắn vào mảng JSON 'messages'."""
    try:
        # 1. Get current messages
        current = get_session_details(db, session_id)
        if not current:
             raise ValueError("Session not found")
        
        existing_msgs = current.get("messages") or []
        if isinstance(existing_msgs, str): # Fallback nếu DB lưu string
             import json
             existing_msgs = json.loads(existing_msgs)
        
        # 2. Append
        updated_msgs = existing_msgs + [new_message]
        
        # 3. Update DB
        db.table("conversation_sessions").update({
            "messages": updated_msgs,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", session_id).execute()
        
        return updated_msgs
    except Exception as e:
        print(f"DB Error (append_message): {e}")
        raise

def update_session_summary(db: Client, session_id: str, summary_text: str, updated_msgs: List[Dict[str, Any]]):
    """Cập nhật summary và messages cuối cùng."""
    try:
        db.table("conversation_sessions").update({
            "ai_feedback_summary": summary_text,
            "messages": updated_msgs,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", session_id).execute()
    except Exception as e:
        print(f"DB Error (update_summary): {e}")
        raise

def delete_session(db: Client, session_id: str, user_id: str):
    """Xóa session (có check owner)."""
    try:
        # Check owner logic nên làm ở service/router, ở đây chỉ xóa
        db.table("conversation_sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"DB Error (delete_session): {e}")
        raise
    
# AI suggestion 
def get_session_messages_by_id(db: Client, session_id: str, user_id: str) -> List[Dict[str, Any]]:
    """
    Lấy cột 'messages' (JSON array) từ session, có check quyền user_id.
    """
    try:
        response = db.table("conversation_sessions") \
            .select("messages") \
            .eq("id", session_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()

        # Kiểm tra data
        if not response.data or "messages" not in response.data:
            return []
            
        messages = response.data["messages"]
        
        # Fallback nếu DB lưu dạng string
        if isinstance(messages, str):
            messages = json.loads(messages)
            
        return messages
        
    except Exception as e:
        # Xử lý lỗi "0 rows" (PGRST116)
        if "PGRST116" in str(e) or "The result contains 0 rows" in str(e):
             raise ValueError("Session not found or Access Denied")
        
        print(f"DB Error (get_session_messages_by_id): {e}")
        raise e