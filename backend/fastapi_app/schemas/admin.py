
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional,List

# --- Update User Status & Role ---
class UpdateUserStatus(BaseModel):
    status: str = Field(..., description="Trạng thái mới: 'active' hoặc 'blocked'.")

class UpdateUserRole(BaseModel):
    role: str = Field(..., description="Vai trò mới: 'admin' hoặc 'user'.")

# --- Admin User Detail Response ---
class AdminUserDetail(BaseModel):
    id: str = Field(alias='user_id') 
    username: str
    avatar_url: Optional[str] = None
    # Các trường mặc định
    role: str = Field(default='user')
    status: str = Field(default='active')
    
    # Database trả về updated_at
    updated_at: Optional[str] = None
    last_login_date: Optional[str] = None
    badge: int = Field(default=0)
    
    # Trường tính toán
    session_count: int = Field(default=0)

    class Config:
        populate_by_name = True 
        
class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None # 'admin' hoặc 'user'
    status: Optional[str] = None # 'active' hoặc 'blocked'
    badge: Optional[int] = None

# --- Session Overview Response (MỚI THÊM) ---
class SessionOverview(BaseModel):
    id: str
    topic: Optional[str] = "General Conversation"
    created_at: str

# --- Chi tiết 1 tin nhắn ---
class MessageDetail(BaseModel):
    role: str # "user", "ai", "system"
    text: str
    type: Optional[str] = "chat" # "chat", "summary", "analysis"
    timestamp: str 
    # metadata có thể chứa JSON phức tạp, dùng Dict
    metadata: Optional[Dict[str, Any]] = None 

# --- Chi tiết Session (Bao gồm Overview và Messages) ---
class SessionDetail(BaseModel):
    overview: SessionOverview
    messages: List[MessageDetail]