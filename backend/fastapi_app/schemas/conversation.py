from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

# ===========================
# --- Message Metadata ---
# ===========================
class MessageMetadata(BaseModel):
    """Thông tin chi tiết đánh giá từng câu (AI feedback)."""
    grammar_score: Optional[float] = Field(None, description="Điểm ngữ pháp (0–1)")
    pronunciation_score: Optional[float] = Field(None, description="Điểm phát âm (0–1)")
    fluency_score: Optional[float] = Field(None, description="Độ trôi chảy (0–1)")
    tips: Optional[str] = Field(None, description="Gợi ý cải thiện của AI")
    keywords: Optional[List[str]] = Field(default_factory=list, description="Từ vựng quan trọng hoặc sai chính tả")
    detected_errors: Optional[List[str]] = Field(default_factory=list, description="Các lỗi phát hiện được")
    evaluation: Optional[str] = Field(None, description="Phản hồi tổng quan của AI cho câu này")

# ===========================
# --- Message Runtime ---
# ===========================
class Message(BaseModel):
    """Cấu trúc tin nhắn dùng trong hội thoại (Runtime)."""
    role: str                   # 'user' hoặc 'ai'
    text: str                   # Nội dung
    type: Optional[str] = None  # 'feedback', 'summary', 'speech'
    metadata: Optional[MessageMetadata] = None

# ===========================
# --- Scenario Info ---
# ===========================
class ScenarioInfo(BaseModel):
    id: str
    title: str

# ===========================
# --- Start Conversation ---
# ===========================
class StartConversationRequest(BaseModel):
    mode: str
    level: str
    scenario_id: Optional[str] = None
    topic: Optional[str] = None
    lesson_id: Optional[str] = Field(None, description="Lesson ID cho mục đích tracking Roadmap.")

    class Config:
        extra = "ignore"

class StartConversationResponse(BaseModel):
    greeting: str
    suggestions: Optional[List[str]] = None
    session_id: str

# ===========================
# --- Voice Evaluation ---
# ===========================
class EvaluateVoiceResponse(BaseModel):
    transcribed_text: str
    immediate_feedback: str
    next_ai_reply: str
    next_user_suggestion: Optional[str] = None
    is_complete: bool
    metadata: Optional[MessageMetadata] = None

# ===========================
# --- Free Talk Chat ---
# ===========================
class FreeTalkChatRequest(BaseModel):
    message: str
    history: List[Message] = Field(default_factory=list)
    topic: str
    level: str
    session_id: str

class FreeTalkMessageRequest(BaseModel):
    """Dành cho router cũ hoặc tên khác; giống FreeTalkChatRequest."""
    message: str
    history: List[Message] = Field(default_factory=list)
    topic: str
    level: str
    session_id: str

class ChatResponse(BaseModel):
    reply: str
    feedback: str
    transcribed_text: Optional[str] = None
    metadata: Optional[MessageMetadata] = None

# ===========================
# --- Summarize ---
# ===========================
class SummarizeRequest(BaseModel):
    history: List[Message] = Field(default_factory=list)
    level: str
    topic: str
    session_id: str

class SummarizeResponse(BaseModel):
    summary_text: str
    overall_score: Optional[float] = Field(None, description="Điểm tổng kết toàn buổi")
    summary_metadata: Optional[Dict[str, Any]] = Field(None, description="Các điểm đánh giá tổng quát")

# ===========================
# --- History ---
# ===========================
class HistorySession(BaseModel):
    id: str
    created_at: datetime
    topic: str
    mode: str
    level: str
    user_id: Optional[str] = None
    lesson_id: Optional[str] = None

class HistoryMessage(BaseModel):
    role: str
    text: str
    type: Optional[str] = None
    metadata: Optional[MessageMetadata] = None

class HistoryDetails(HistorySession):
    messages: List[HistoryMessage] = Field(default_factory=list)
    ai_feedback_summary: Optional[str] = None
