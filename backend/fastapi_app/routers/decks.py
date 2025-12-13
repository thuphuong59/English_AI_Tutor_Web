from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from typing import List
from fastapi_app import schemas
from fastapi_app.schemas.decks import Deck, TopicRequest, DeckSessionResponse
from fastapi_app.dependencies import get_current_user_id
from fastapi_app.crud import decks as deck_crud
from fastapi_app.crud import vocabulary as vocab_crud
from fastapi_app.services import vocabulary

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


@router.post("/create-deck", response_model=Deck) 
async def start_topic(
    topic_req: TopicRequest, 
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id) # API ĐÃ YÊU CẦU XÁC THỰC
):
    # 1. Gọi Service kiểm tra Deck tồn tại
    existing_deck = await vocabulary.check_existing_deck(user_id, topic_req.topic_name)
    if existing_deck:
        return existing_deck

    # 2. Gọi Service tạo Deck mới
    print("🔥 topic_req.lesson_id =", topic_req.lesson_id)

    new_deck = await vocabulary.create_new_deck(user_id, topic_req.topic_name,topic_req.lesson_id)
    if not new_deck:
        raise HTTPException(status_code=500, detail="Không thể tạo bộ từ")

    # 3. Đưa việc nạp từ vào task ngầm
    background_tasks.add_task(
        vocabulary.generate_vocab_for_deck_supabase, 
        new_deck["id"], 
        topic_req.topic_name, 
        user_id
    )

    return new_deck

    
@router.post("/start-quiz", response_model=DeckSessionResponse) 
async def start_quiz_session(
    topic_req: schemas.TopicRequest, 
    user_id: str = Depends(get_current_user_id)
):
    """
    API này tìm Deck đã tồn tại và trả về ID của Deck đó (Deck ID).
    Nếu Deck chưa có (chưa click TIÊU ĐỀ để tạo), trả về lỗi 404.
    """
    try:
        # 1. KIỂM TRA DECK TỒN TẠI
        # Gọi hàm CRUD đã được sửa đổi để tìm Deck bằng topic_name và user_id
        deck_record = await  vocabulary.check_existing_deck(
            user_id=user_id, 
            topic_name=topic_req.topic_name
        )
        
        if not deck_record:
            # 🛑 TRẢ VỀ LỖI 404 nếu Deck chưa được tạo (theo logic nút START)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Bộ từ vựng cho chủ đề này chưa được tạo. Vui lòng click vào TIÊU ĐỀ task để tạo bộ từ vựng trước khi làm bài Quiz."
            )

        deck_id = deck_record['id']
        
        # 2. BỎ QUA VIỆC TẠO SESSION QUIZ
        # 3. TRẢ VỀ DECK ID (sẽ được Frontend dùng làm ID để điều hướng)
        return {"id": deck_id}
        
    except HTTPException as e:
        # Re-raise lỗi 404 hoặc 401/403 nếu có
        raise e
    except Exception as e:
        # Xử lý các lỗi DB không xác định (ví dụ: lỗi kết nối)
        print(f"Lỗi không xác định trong start_quiz_session: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail="Lỗi máy chủ khi truy vấn Deck.")