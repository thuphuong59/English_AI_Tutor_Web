from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import date, datetime
from fastapi_app.schemas.vocabulary import VocabularyStats, WordInDB

# --- Deck Schemas ---

class DeckBase(BaseModel):
    name: str
    description: Optional[str] = None

class DeckCreate(DeckBase):
    pass

class Deck(DeckBase):
    id: int
    user_id: str 

    class Config:
        from_attributes = True # Cập nhật cho Pydantic v2

# Schema trả về cho Dashboard (kết hợp)
class DeckWithStats(Deck):
    stats: VocabularyStats # Tái sử dụng schema VocabularyStats từ file vocabulary

class DeckDetail(BaseModel):
    """
    Schema trả về cho trang chi tiết bộ từ
    """
    deck_info: Deck             # Thông tin của bộ từ (Tên, mô tả...)
    stats: VocabularyStats      # Thống kê của riêng bộ từ này
    words: List[WordInDB]       # Danh sách các từ trong bộ này

    class Config:
        from_attributes = True
        
class DeckUpdate(BaseModel):
    """Schema khi người dùng cập nhật tên/mô tả của Deck."""
    name: Optional[str] = None
    description: Optional[str] = None

# --- Public Deck Schemas ---

class PublicDeck(BaseModel):
    """Schema cho một Bộ từ Công cộng (từ bảng PublicDecks)"""
    id: int
    name: str
    level: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class PublicWord(BaseModel):
    """Schema cho một Từ vựng Công cộng (từ bảng PublicWords)"""
    id: int
    deck_id: int
    word: str
    type: Optional[str] = None # <--- THÊM MỚI: Để đồng bộ hiển thị loại từ
    definition: str
    pronunciation: Optional[str] = None
    context_sentence: Optional[str] = None
    audio_url: Optional[str] = None

    class Config:
        from_attributes = True

class PublicDeckDetail(BaseModel):
    """Schema gộp, trả về cho trang chi tiết bộ từ công cộng"""
    deck_info: PublicDeck
    words: List[PublicWord]

    class Config:
        from_attributes = True
    
# --- AI ANALYSIS ---

class AnalyzeResponse(BaseModel):
    """Schema trả về cho API /analyze"""
    message: str
    words_added: int
    
class ConversationSession(BaseModel):
    session_id: str 

class AISuggestionWord(BaseModel):
    word: str
    type: Optional[str] = None
    definition: str
    pronunciation: Optional[str] = None
    context_sentence: Optional[str] = None
    audio_url: Optional[str] = None

# --- Quiz Game ---

class SmartQuestion(BaseModel):
    word: str 
    type: Literal["MC_V2D", "MC_C2V", "TYPE_D2V"]
    questionText: str
    options: Optional[List[str]] = None
    correctAnswer: str

class QuizFeedbackRequest(BaseModel):
    missed_words: List[str] # Frontend chỉ cần gửi list các từ sai

class QuizResultCreate(BaseModel):
    deck_id: int | None = None
    score: int
    total_questions: int
class TopicRequest(BaseModel):
    """Schema dùng cho input khi người dùng click START topic"""
    topic_name: str
    lesson_id: str
    
class DeckResponse(BaseModel):
    """Schema đơn giản trả về cho Frontend biết trạng thái của Deck"""
    id: int 
    status: str # Ví dụ: "exists" hoặc "generating"

