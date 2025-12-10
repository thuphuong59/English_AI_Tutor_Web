from pydantic import BaseModel, Field
from typing import List, Optional, Dict

# --- Input/Request Schemas ---

class GrammarTopicRequest(BaseModel):
    """Schema input khi user click START (Tái sử dụng từ TopicRequest nhưng rõ ràng hơn)"""
    topic_name: str = Field(..., description="Tên chủ đề ngữ pháp (ví dụ: Present Simple)")
    lesson_id: str = Field(..., description="ID bài học từ Roadmap (ví dụ: A1_W1_Grammar1)")

# --- Question/Content Schemas ---

class QuizQuestion(BaseModel):
    """Cấu trúc một câu hỏi được AI tạo ra."""
    question_text: str
    options: List[str]
    correct_answer: str = Field(..., description="Key đáp án đúng (ví dụ: A, B, C)")
    
class QuizQuestionInDB(QuizQuestion):
    """Cấu trúc câu hỏi khi được lưu vào DB (có ID)"""
    id: int
    topic: str
    user_id: str

# --- Output/Response Schemas ---

class QuizSessionStartResponse(BaseModel):
    """Schema trả về ID của phiên test vừa tạo."""
    id: int
    
class QuizSubmission(BaseModel):
    """Schema đầu vào khi người dùng nộp bài."""
    session_id: int
    user_id: str
    answers: Dict[int, str] = Field(..., description="Đáp án của user {question_id: selected_option_key}")

class QuizResultSummary(BaseModel):
    """Schema trả về kết quả sau khi nộp bài."""
    score_percent: float = Field(..., description="Điểm đạt được (0.0 - 1.0)")
    correct_count: int
    total_questions: int
    weak_areas: List[str] = Field(..., description="Các chủ đề ngữ pháp yếu (cho lộ trình)")