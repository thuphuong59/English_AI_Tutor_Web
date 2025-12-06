from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

class MessageMetadata(BaseModel):
    """Thông tin chi tiết đánh giá từng câu (AI feedback)."""
    grammar_score: Optional[float] = Field(None, description="Điểm ngữ pháp (0–1)")
    pronunciation_score: Optional[float] = Field(None, description="Điểm phát âm (0–1)")
    fluency_score: Optional[float] = Field(None, description="Độ trôi chảy (0–1)")
    tips: Optional[str] = Field(None, description="Gợi ý cải thiện của AI")
    keywords: Optional[List[str]] = Field(None, description="Từ vựng quan trọng hoặc sai chính tả")
    detected_errors: Optional[List[str]] = Field(None, description="Các lỗi phát hiện được")
    evaluation: Optional[str] = Field(None, description="Phản hồi tổng quan của AI cho câu này")


class Message(BaseModel):
    """Cấu trúc tin nhắn dùng trong hội thoại."""
    role: str                               # 'user' hoặc 'ai'
    text: str                               # nội dung
    type: Optional[str] = None              # 'feedback', 'summary', 'speech'
    metadata: Optional[MessageMetadata] = None  # điểm & đánh giá chi tiết

class ScenarioInfo(BaseModel):
    id: str
    title: str


class StartConversationRequest(BaseModel):
    mode: str
    level: str
    scenario_id: Optional[str] = None
    topic: Optional[str] = None

class StartConversationResponse(BaseModel):
    greeting: str
    suggestions: Optional[List[str]] = None
    session_id: str

class EvaluateVoiceResponse(BaseModel):
    transcribed_text: str
    immediate_feedback: str
    next_ai_reply: str
    next_user_suggestion: Optional[str] = None
    is_complete: bool
    metadata: Optional[MessageMetadata] = None

class FreeTalkChatRequest(BaseModel):
    message: str
    history: List[Message]
    topic: str
    level: str
    session_id: str
    
class ChatResponse(BaseModel):
    reply: str
    feedback: str
    transcribed_text: Optional[str] = None
    metadata: Optional[MessageMetadata] = None
    
class SummarizeRequest(BaseModel):
    history: List[Message]
    level: str
    topic: str
    session_id: str

class SummarizeResponse(BaseModel):
    summary_text: str
    overall_score: Optional[float] = Field(None, description="Điểm tổng kết toàn buổi")
    summary_metadata: Optional[Dict[str, Any]] = Field(None, description="Các điểm đánh giá tổng quát (grammar, pronunciation, vocabulary, fluency)")


class HistorySession(BaseModel):
    id: str
    created_at: datetime
    topic: str
    mode: str
    level: str
    user_id: Optional[str] = None  


class HistoryMessage(BaseModel):
    role: str
    content: str
    message_type: Optional[str] = None
    metadata: Optional[MessageMetadata] = None


class HistoryDetails(HistorySession):
    messages: List[HistoryMessage]

class StartConversationRequest(BaseModel): 
    mode: str 
    level: str 
    scenario_id: Optional[str] = None 
    topic: Optional[str] = None 
class FreeTalkMessageRequest(BaseModel): 
    message: str 
    history: List[Dict[str, Any]] 
    topic: str 
    level: str 
    session_id: str

