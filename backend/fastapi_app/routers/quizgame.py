from fastapi import APIRouter, Depends, HTTPException, status 
from typing import List

from fastapi_app import schemas
from fastapi_app.dependencies import get_current_user 
from fastapi_app.services import quizgame as quiz_service

router = APIRouter()

@router.get(
    "/quiz-data/{deck_type}-deck/{deck_id}", 
    response_model=List[schemas.SmartQuestion], 
    tags=["Quiz Game"]
)
def get_smart_quiz_data(
    deck_type: str, 
    deck_id: int,   
    current_user = Depends(get_current_user) 
):
    """
    API chính cho Ý tưởng 2: Tạo và trả về một bộ câu hỏi
    game "thông minh" (hỗn hợp 3 loại game).
    """
    user_id = current_user.id # Lấy user_id từ token
    
    try:
        return quiz_service.create_smart_quiz(
            deck_type=deck_type, 
            deck_id=deck_id, 
            user_id=user_id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"--- LỖI THẬT TRONG router get_smart_quiz_data ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/quiz/feedback", 
    tags=["Quiz Game"],
    status_code=status.HTTP_201_CREATED
)
def submit_quiz_feedback(
    feedback_data: schemas.QuizFeedbackRequest,
    current_user = Depends(get_current_user)
):
    """
    API cho Ý tưởng 3: Nhận các từ sai từ frontend
    và thêm chúng vào bảng WordSuggestions.
    """
    user_id = current_user.id
    
    try:
        return quiz_service.process_quiz_feedback(
            user_id=user_id, 
            missed_words=feedback_data.missed_words
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"--- LỖI THẬT TRONG router submit_quiz_feedback ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))