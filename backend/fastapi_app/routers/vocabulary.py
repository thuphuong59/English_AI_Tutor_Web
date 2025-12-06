import random
import re
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict, List

from fastapi_app import schemas
from fastapi_app.dependencies import get_current_user_id
from fastapi_app.crud import vocabulary as crud 


router = APIRouter(
    prefix="/vocabulary",
    tags=["Vocabulary"],
    dependencies=[Depends(get_current_user_id)] # Bảo mật tất cả API
)
@router.get("/dashboard", response_model=schemas.DashboardData)
def get_dashboard_data(user_id: str = Depends(get_current_user_id)):
    """
    API MỚI: Lấy tất cả dữ liệu (stats, my-words, suggestions) 
    chỉ trong 1 lần gọi.
    """
    print("API: /dashboard được gọi")
    try:
        stats = crud.get_stats_for_user(user_id=user_id)
        words = crud.get_words_for_user(user_id=user_id)
        suggestions = crud.get_suggestions_for_user(user_id=user_id)
        
        return {
            "stats": stats,
            "my_words": words,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"--- LỖI TRONG /dashboard ---: {e}")
        raise HTTPException(status_code=500, detail="Lỗi khi lấy dữ liệu dashboard") 
    
# READ

@router.get("/stats", response_model=schemas.VocabularyStats)
def get_vocabulary_stats(user_id: str = Depends(get_current_user_id)):
    """API 1: Lấy thông số thống kê cho dashboard."""
    return crud.get_stats_for_user(user_id=user_id)


@router.get("/my-words", response_model=List[schemas.WordInDB])
def get_my_words(user_id: str = Depends(get_current_user_id)):
    """API 2: Lấy danh sách 'Từ của tôi'."""
    return crud.get_words_for_user(user_id=user_id)


@router.get("/suggestions", response_model=List[schemas.WordSuggestion])
def get_suggestions(user_id: str = Depends(get_current_user_id)):
    """API 3: Lấy danh sách 'Từ gợi ý'."""
    return crud.get_suggestions_for_user(user_id=user_id)


@router.get("/review-queue", response_model=List[schemas.WordInDB])
def get_review_queue(user_id: str = Depends(get_current_user_id)):
    """API 4: Lấy danh sách từ vựng cần ôn tập hôm nay."""
    return crud.get_review_queue_for_user(user_id=user_id)

# CREATE 

@router.post("/new-word", response_model=schemas.WordInDB, status_code=status.HTTP_201_CREATED)
def create_new_word(word_data: schemas.WordCreate, user_id: str = Depends(get_current_user_id)):
    """API 5: Tự thêm một từ vựng mới (từ modal)."""
    return crud.create_word_for_user(word_data=word_data, user_id=user_id)


@router.post("/suggestions/add", response_model=schemas.SuccessResponse)
def add_suggestion_to_vocabulary(
    suggestion: schemas.SuggestionAdd, 
    user_id: str = Depends(get_current_user_id)
):
    """API 6: Chuyển một từ gợi ý sang bộ học chính."""
    
    # Lấy 'deck_id' TỪ 'suggestion.deck_id'
    return crud.add_suggestion_for_user(
        suggestion_id=suggestion.suggestion_id, 
        user_id=user_id, 
        deck_id=suggestion.deck_id 
    )


# UPDATE

@router.post("/review", response_model=schemas.SuccessResponse)
def submit_review(result: schemas.ReviewResult, user_id: str = Depends(get_current_user_id)):
    """API 7: Cập nhật tiến trình SRS (thuật toán SM-2)."""
    return crud.update_word_review(result=result, user_id=user_id)

@router.patch("/{word_id}", response_model=schemas.WordInDB)
def update_word(word_id: int, word_data: schemas.WordUpdate, user_id: str = Depends(get_current_user_id)):
    """API 9: Cập nhật chi tiết của một từ vựng (cho modal 'Edit Word')."""
    return crud.update_word_for_user(word_id=word_id, word_data=word_data, user_id=user_id)


# DELETE 
@router.delete("/{word_id}", response_model=schemas.SuccessResponse)
def delete_word(word_id: int, user_id: str = Depends(get_current_user_id)):
    """API 10: Xóa một từ vựng khỏi 'Từ của tôi'."""
    return crud.delete_word_for_user(word_id=word_id, user_id=user_id) 

@router.post("/deck/{deck_id}/new-word", response_model=schemas.WordInDB, status_code=status.HTTP_201_CREATED)
def create_new_word_in_deck(
    deck_id: int, 
    word_data: schemas.WordCreate, 
    user_id: str = Depends(get_current_user_id)
):
    """
    Tự thêm một từ vựng mới (từ modal) VÀO MỘT BỘ TỪ (DECK) CỤ THỂ.
    """
    return crud.create_word_for_user(
        word_data=word_data, 
        user_id=user_id, 
        deck_id=deck_id
    )
@router.get("/deck/{deck_id}/review-queue", response_model=List[schemas.WordInDB])
def get_review_queue_for_deck(deck_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Lấy danh sách từ vựng cần ôn tập hôm nay
    CHO MỘT BỘ TỪ (DECK) CỤ THỂ.
    """
    return crud.get_review_queue_for_user(user_id=user_id, deck_id=deck_id)


