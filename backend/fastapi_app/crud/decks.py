from fastapi import HTTPException, status
from fastapi_app import schemas
from fastapi_app.database import db_client
from . import vocabulary as vocab_crud 

def create_deck_for_user(deck_data: schemas.DeckCreate, user_id: str):
    """Tạo một bộ từ (Deck) mới cho người dùng."""
    try:
        data_to_insert = deck_data.dict()
        data_to_insert["user_id"] = user_id
        
        response = db_client.table("Decks").insert(data_to_insert).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Tạo bộ từ thất bại")
        return response.data[0]
    except Exception as e:
        print(f"--- LỖI THẬT TRONG create_deck ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

def get_all_decks_with_stats(user_id: str):
    """
    Lấy TẤT CẢ các bộ từ của người dùng VÀ thống kê cho mỗi bộ.
    """
    try:
        # Lấy tất cả các bộ từ
        decks_response = db_client.table("Decks").select("*") \
            .eq("user_id", user_id).order("created_at", desc=True).execute()
        
        decks_data = decks_response.data
        decks_with_stats = []

        # Lặp qua từng bộ từ để lấy thống kê
        for deck in decks_data:
            deck_id = deck["id"]
            
            stats = vocab_crud.get_stats_for_user(user_id=user_id, deck_id=deck_id)
            
            #  Gộp lại
            deck_with_stats = {
                **deck,
                "stats": stats
            }
            decks_with_stats.append(deck_with_stats)
            
        return decks_with_stats
    except Exception as e:
        print(f"--- LỖI THẬT TRONG get_all_decks ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

def get_deck_by_id(deck_id: int, user_id: str):
    """Lấy thông tin của MỘT bộ từ (cho trang chi tiết)."""
    try:
        response = db_client.table("Decks").select("*") \
            .eq("id", deck_id).eq("user_id", user_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy bộ từ")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def update_deck(deck_id: int, deck_data: schemas.DeckUpdate, user_id: str):
    """Cập nhật tên hoặc mô tả của một bộ từ."""
    try:
        data_to_update = deck_data.dict(exclude_unset=True)
        if not data_to_update:
            raise HTTPException(status_code=400, detail="Không có thông tin nào để cập nhật")

        response = db_client.table("Decks").update(data_to_update) \
            .eq("id", deck_id).eq("user_id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy bộ từ")
        return response.data[0]
    except Exception as e:
        print(f"--- LỖI THẬT TRONG update_deck ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

#  DELETE 
def delete_deck(deck_id: int, user_id: str):
    """Xóa một bộ từ (và tất cả từ vựng bên trong - nhờ CSDL)."""
    try:
        response = db_client.table("Decks").delete() \
            .eq("id", deck_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy bộ từ")
        return {"success": True}
    except Exception as e:
        print(f"--- LỖI THẬT TRONG delete_deck ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e)) 
    
def get_all_public_decks():
    """Lấy TẤT CẢ các bộ từ công cộng (ví dụ: Oxford 3000, Giao tiếp)"""
    try:
        response = db_client.table("PublicDecks").select("*").execute()
        return response.data
    except Exception as e:
        print(f"--- LỖI THẬT TRONG get_all_public_decks ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

def get_public_deck_details(deck_id: int):
    """Lấy chi tiết 1 bộ từ công cộng VÀ các từ vựng bên trong nó."""
    try:
        deck_info = db_client.table("PublicDecks").select("*") \
            .eq("id", deck_id).single().execute().data
        
        if not deck_info:
            raise HTTPException(status_code=404, detail="Không tìm thấy bộ từ công cộng")

        words = db_client.table("PublicWords").select("*") \
            .eq("deck_id", deck_id).execute().data
            
        # Gộp lại
        return {
            "deck_info": deck_info,
            "words": words
        }
    except Exception as e:
        print(f"--- LỖI THẬT TRONG get_public_deck_details ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))