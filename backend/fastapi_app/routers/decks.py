from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from fastapi_app import schemas
from fastapi_app.dependencies import get_current_user_id
from fastapi_app.crud import decks as deck_crud
from fastapi_app.crud import vocabulary as vocab_crud

router = APIRouter(
    prefix="/decks", 
    tags=["Decks"],
    dependencies=[Depends(get_current_user_id)]
)

@router.post("/", response_model=schemas.Deck, status_code=status.HTTP_201_CREATED)
def create_new_deck(deck_data: schemas.DeckCreate, user_id: str = Depends(get_current_user_id)):
    """Tạo một bộ từ (Deck) mới."""
    return deck_crud.create_deck_for_user(deck_data=deck_data, user_id=user_id)


@router.get("/", response_model=List[schemas.DeckWithStats])
def get_all_user_decks(user_id: str = Depends(get_current_user_id)):
    """
    Lấy tất cả các bộ từ của người dùng, KÈM THEO thống kê (stats).
    """
    return deck_crud.get_all_decks_with_stats(user_id=user_id)


@router.get("/{deck_id}", response_model=schemas.DeckDetail)
def get_deck_details(deck_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Lấy thông tin chi tiết của MỘT bộ từ (API đang bị lỗi 500).
    """
    try:
        deck_info = deck_crud.get_deck_by_id(deck_id=deck_id, user_id=user_id)
        stats = vocab_crud.get_stats_for_user(user_id=user_id, deck_id=deck_id)
        words = vocab_crud.get_words_for_user(user_id=user_id, deck_id=deck_id)

        return {
            "deck_info": deck_info,
            "stats": stats,
            "words": words
        }
    except Exception as e:
        print(f"--- LỖI THẬT TRONG get_deck_details ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
    
@router.patch("/{deck_id}", response_model=schemas.Deck)
def update_deck_details(
    deck_id: int, 
    deck_data: schemas.DeckUpdate, 
    user_id: str = Depends(get_current_user_id)
):
    """Cập nhật tên/mô tả của một bộ từ."""
    return deck_crud.update_deck(deck_id=deck_id, deck_data=deck_data, user_id=user_id)


# DELETE
@router.delete("/{deck_id}", response_model=schemas.SuccessResponse)
def delete_user_deck(
    deck_id: int, 
    user_id: str = Depends(get_current_user_id)
):
    """Xóa một bộ từ."""
    return deck_crud.delete_deck(deck_id=deck_id, user_id=user_id)