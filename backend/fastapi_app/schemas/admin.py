
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

# --- DECKS (Bộ từ vựng) ---
class DeckBase(BaseModel):
    name: str = Field(..., description="Tên bộ từ")
    description: Optional[str] = None
    level: Optional[str] = "beginner" 
    image_url: Optional[str] = None

class DeckCreate(DeckBase):
    pass

class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    image_url: Optional[str] = None
    # is_public có thể không có trong DB, ta xử lý logic riêng

class DeckResponse(DeckBase):
    id: int  # <--- SỬA: Đổi từ str sang int
    is_public: bool = Field(default=True) # <--- SỬA: Mặc định là True nếu DB không trả về
    created_at: Optional[str] = None 
    word_count: int = Field(default=0)

    class Config:
        from_attributes = True

# --- VOCABULARY (Từ vựng) ---
class VocabBase(BaseModel):
    word: str
    meaning: Optional[str] = None # Database có thể là definition
    definition: Optional[str] = None # Thêm trường này để map với PublicWords
    ipa: Optional[str] = None # pronunciation
    pronunciation: Optional[str] = None # Thêm trường này
    example_sentence: Optional[str] = None # context_sentence
    context_sentence: Optional[str] = None # Thêm trường này
    audio_url: Optional[str] = None
    type: Optional[str] = None
    
class VocabCreate(VocabBase):
    deck_id: int # <--- SỬA: Đổi từ str sang int

class VocabUpdate(BaseModel):
    word: Optional[str] = None
    definition: Optional[str] = None
    pronunciation: Optional[str] = None
    context_sentence: Optional[str] = None
    audio_url: Optional[str] = None
    type: Optional[str] = None

class VocabResponse(VocabBase):
    id: int # <--- SỬA: Đổi từ str sang int
    deck_id: int # <--- SỬA: Đổi từ str sang int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

# Schema cho 1 câu thoại
class DialogueLine(BaseModel):
    turn: int
    speaker: str # 'ai' hoặc 'user'
    line: str

# Schema cho Kịch bản (Scenario)
class ScenarioBase(BaseModel):
    title: str
    topic: str
    level: str # Beginner, Intermediate, Advanced

class ScenarioCreate(ScenarioBase):
    dialogues: List[DialogueLine] # Khi tạo, gửi kèm luôn nội dung hội thoại

class ScenarioUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    level: Optional[str] = None
    # Để đơn giản, update dialogues ta sẽ làm logic riêng hoặc ghi đè toàn bộ

class ScenarioResponse(ScenarioBase):
    id: str
    created_at: Optional[str] = None
    # Trả về kèm dialogues để hiển thị chi tiết
    dialogues: Optional[List[DialogueLine]] = None

    class Config:
        from_attributes = True