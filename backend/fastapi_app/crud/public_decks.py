from fastapi import HTTPException, status
from fastapi_app import schemas
from fastapi_app.database import db_client

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