from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

# --- 1. Dữ liệu Khảo sát (Input) ---
class PreferenceData(BaseModel):
    """Lưu trữ 4 câu trả lời khảo sát ban đầu về mục tiêu giao tiếp."""
    
    communication_goal: str    # B1: Mục tiêu Giao tiếp
    target_duration: str        # B2: Thời gian Mục tiêu
    confidence_barrier: str     # B3: Rào cản Tự tin
    daily_commitment: str       # B4: Cam kết Thời gian Hàng ngày
# --- 2. Cấu trúc Câu hỏi Quiz (Dữ liệu gốc từ LLM) ---
class QuizQuestion(BaseModel):
    """
    Schema cho một câu hỏi Quiz đơn lẻ (MCQ hoặc Speaking Prompt). 
    """
    id: int
    question_text: str
    options: List[str]
    correct_answer_key: str 
    question_type: str = Field('grammar', description="Loại câu hỏi: 'grammar', 'vocabulary', hoặc 'speaking_prompt'") # Sử dụng Field để thêm mô tả

# --- 3. Dữ liệu Speaking (Payload JSON) ---
class SpeakingAssessmentData(BaseModel):
    """Dữ liệu phản xạ và các chỉ số của mỗi câu hỏi Speaking."""
    question_id: int
    latency_ms: float
    duration_s: float
    file_key: str # Khóa liên kết với file audio (Ví dụ: "q21")

# --- 4. FINAL ASSESSMENT PAYLOAD (Dữ liệu gửi lên khi Submit) ---
class FinalAssessmentSubmission(BaseModel):
    """Schema tổng hợp dữ liệu JSON được gửi qua trường 'payload' của FormData."""
    user_id: str 
    preferences: PreferenceData
    mcq_answers: Dict[str, str]  # Câu trả lời trắc nghiệm (ID câu hỏi: Key đáp án)
    speaking_data: List[SpeakingAssessmentData] # Dữ liệu Speaking JSON
    quiz_questions: List[QuizQuestion] # 👈 CÂU HỎI GỐC (Dùng để chấm điểm)

# --- 5. Cấu trúc Phản hồi Quiz (Backend Output) ---
class InitialQuizResponse(BaseModel):
    """Schema cho phản hồi cuối cùng chứa các câu hỏi chẩn đoán đã tạo."""
    quiz_title: str = "Bài kiểm tra chẩn đoán giao tiếp ban đầu"
    user_preferences: PreferenceData
    questions: List[QuizQuestion]