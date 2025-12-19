from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from fastapi_app.services import pronunciation_service
from fastapi_app.dependencies import get_current_user_id
from fastapi_app.schemas.pronunciation_schemas import PronunciationFeedbackResponse
import json

router = APIRouter(prefix="/api/pronunciation", tags=["Pronunciation"])

@router.post("/check-freestyle", response_model=PronunciationFeedbackResponse)
async def check_freestyle_pronunciation(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    x_accent: str = Header("en-US")
):
    try:
        raw_feedback = await pronunciation_service.process_freestyle_pronunciation(file, x_accent)
        
        # Làm sạch chuỗi JSON từ AI
        clean_json = raw_feedback.strip()
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
        
        feedback_data = json.loads(clean_json)
        return feedback_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))