# D:\English_AI_Tutor_Web\backend\fastapi_app\schemas\pronunciation_schemas.py
from pydantic import BaseModel
from typing import List

class WordAnalysis(BaseModel):
    word: str
    ipa: str
    error: str
    fix: str

# Đảm bảo tên Class trùng khớp hoàn toàn (không sai chính tả)
class PronunciationFeedbackResponse(BaseModel):
    transcript: str
    overall_score: int
    detailed_analysis: List[WordAnalysis]
    quick_tip: str