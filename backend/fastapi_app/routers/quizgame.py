from fastapi import APIRouter, Depends, HTTPException, status 
from typing import List

from fastapi_app.schemas.decks import QuizResultCreate
from fastapi_app.schemas.vocabulary import SuccessResponse
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
    try:
       
        user_id = str(current_user.id)
        
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
    try:
        user_id = str(current_user.id)
        
        return quiz_service.process_quiz_feedback(
            user_id=user_id, 
            missed_words=feedback_data.missed_words
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"--- LỖI THẬT TRONG router submit_quiz_feedback ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/quiz/save-result", response_model=SuccessResponse)
def save_quiz_result(
    result_data: QuizResultCreate,
    current_user = Depends(get_current_user) 
):
    """
    API Endpoint: Lưu kết quả bài kiểm tra.
    Router chỉ nhận request -> gọi Service -> trả về Response.
    """
    try:
        user_id = str(current_user.id)
        quiz_service.process_save_quiz_result(result_data, user_id)
        
        return {
            "success": True, 
            "message": "Đã lưu điểm thành công!"
        }

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(f"Router Error [save_quiz_result]: {e}")
        raise HTTPException(status_code=500, detail=str(e))
