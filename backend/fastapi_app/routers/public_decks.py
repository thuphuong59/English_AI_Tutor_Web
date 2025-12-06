from fastapi import APIRouter, Depends, status
from typing import List
from fastapi_app import schemas
from fastapi_app.dependencies import get_current_user_id 
from fastapi_app.crud import public_decks as crud 

router = APIRouter(
    prefix="/public-decks", # API sẽ là /api/public-decks
    tags=["Public Decks"],
    dependencies=[Depends(get_current_user_id)] # Yêu cầu user phải đăng nhập
)

@router.get("/", response_model=List[schemas.PublicDeck])
def get_all_public_decks_api():
    """
    Lấy danh sách TẤT CẢ các bộ từ 'chính thức' của ứng dụng.
    """
    return crud.get_all_public_decks()


@router.get("/{deck_id}", response_model=schemas.PublicDeckDetail)
def get_public_deck_details_api(deck_id: int):
    """
    Lấy thông tin chi tiết của MỘT bộ từ công cộng (để học).
    """
    return crud.get_public_deck_details(deck_id=deck_id)