from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime


class WordBase(BaseModel):
    """Schema cơ bản cho một từ, dùng chung"""
    word: str
    type: Optional[str] = None 
    pronunciation: Optional[str] = None
    definition: str
    context_sentence: Optional[str] = None

    class Config:
        from_attributes = True

class WordInDB(WordBase):
    """Schema cho dữ liệu trả về (có ID từ DB)"""
    id: int
    status: str
    next_review_date: date
    interval: int
    ease_factor: float
    audio_url: Optional[str] = None
    created_at: Optional[datetime] = None 

    class Config:
        from_attributes = True

class WordSuggestion(WordBase):
    """Schema cho từ gợi ý (WordSuggestions)"""
    id: int
    audio_url: Optional[str] = None

class AISuggestionWord(BaseModel):
    """
    Schema dùng cho kết quả trả về từ AI Service.
    Service vocabulary.py cần class này.
    """
    word: str
    type: Optional[str] = None
    definition: Optional[str] = None
    pronunciation: Optional[str] = None
    context_sentence: Optional[str] = None
    audio_url: Optional[str] = None

# --- Stats ---

class VocabularyStats(BaseModel):
    learning: int
    mastered: int
    review_today: int

# --- Input Schemas ---

class ReviewResult(BaseModel):
    """Schema khi người dùng gửi kết quả ôn tập (SRS)"""
    word_id: int
    quality: int # 0, 1, 3, 5

class SuggestionAdd(BaseModel):
    """Schema khi người dùng nhấn nút 'Thêm' một từ gợi ý"""
    suggestion_id: int
    deck_id: int

class WordCreate(BaseModel):
    """
    Schema khi người dùng tự nhập một từ mới.
    """
    word: str
    type: Optional[str] = None 
    definition: str
    context_sentence: Optional[str] = Field(default=None, alias="example") 

class WordUpdate(BaseModel):
    word: Optional[str] = None
    type: Optional[str] = None
    definition: Optional[str] = None
    context_sentence: Optional[str] = Field(default=None, alias="example")

    class Config:
        from_attributes = True

class SuccessResponse(BaseModel):
    success: bool

# --- Dashboard ---

class DashboardData(BaseModel):
    stats: VocabularyStats
    my_words: List[WordInDB]
    suggestions: List[WordSuggestion] 

    class Config:
        from_attributes = True