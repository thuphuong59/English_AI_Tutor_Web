from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from fastapi import HTTPException, status
from fastapi_app import schemas
from fastapi_app.database import admin_supabase, db_client
from fastapi_app.services.vocabulary import calculate_srs, get_word_details_from_api

# --- READ ---

def get_stats_for_user(user_id: str, deck_id: int) -> schemas.VocabularyStats:
    """Lấy thông số thống kê CHO MỘT BỘ TỪ (DECK) CỤ THỂ."""
    try:
        today = datetime.utcnow().date().isoformat()
            
        learning_count = admin_supabase.table("UserVocabulary").select("id", count="exact") \
            .eq("user_id", user_id) \
            .eq("deck_id", deck_id) \
            .eq("status", "learning").execute().count
            
        mastered_count = admin_supabase.table("UserVocabulary").select("id", count="exact") \
            .eq("user_id", user_id) \
            .eq("deck_id", deck_id) \
            .eq("status", "mastered").execute().count
            
        review_today_count = admin_supabase.table("UserVocabulary").select("id", count="exact") \
            .eq("user_id", user_id) \
            .eq("deck_id", deck_id) \
            .lte("next_review_date", today).execute().count

        return schemas.VocabularyStats(
            learning=learning_count or 0,
            mastered=mastered_count or 0,
            review_today=review_today_count or 0
        )
    except Exception as e:
        print(f"--- LỖI THẬT TRONG get_stats_for_user ---: {e}") 
        raise HTTPException(status_code=500, detail=f"Lỗi máy chủ khi lấy stats: {str(e)}")

def get_words_for_user(user_id: str, deck_id: int):
    """Lấy danh sách 'Từ của tôi' CHO MỘT BỘ TỪ (DECK) CỤ THỂ."""
    try:
        response = admin_supabase.table("UserVocabulary").select("*") \
            .eq("user_id", user_id) \
            .eq("deck_id", deck_id) \
            .order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_suggestions_for_user(user_id: str):
    """Lấy danh sách 'Từ gợi ý' (chung cho user)."""
    try:
        response = admin_supabase.table("WordSuggestions").select("*") \
            .eq("user_id", user_id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_review_queue_for_user(user_id: str, deck_id: int):
    """Lấy danh sách từ vựng cần ôn tập hôm nay CHO MỘT BỘ TỪ (DECK) CỤ THỂ."""
    try:
        today = datetime.utcnow().date().isoformat()

        response = admin_supabase.table("UserVocabulary").select("*") \
            .eq("user_id", user_id) \
            .eq("deck_id", deck_id) \
            .lte("next_review_date", today).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CREATE ---

def create_word_for_user(word_data: schemas.WordCreate, user_id: str, deck_id: int):
    """Tự thêm một từ vựng mới (từ modal) VÀO MỘT BỘ TỪ (DECK)."""
    try:
        data_to_insert = word_data.dict()
        data_to_insert["user_id"] = user_id
        data_to_insert["deck_id"] = deck_id
        
        # Tự động tra cứu phiên âm, âm thanh VÀ loại từ
        word_details = get_word_details_from_api(data_to_insert["word"])
        data_to_insert["pronunciation"] = word_details.get("pronunciation")
        data_to_insert["audio_url"] = word_details.get("audio_url")
        
        # Cập nhật thêm loại từ (type) nếu API trả về
        if word_details.get("type"):
            data_to_insert["type"] = word_details.get("type")
        
        response = admin_supabase.table("UserVocabulary").insert(data_to_insert).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Thêm từ mới thất bại")
        return response.data[0]
    except Exception as e:
        print(f"--- LỖI THẬT TRONG create_word_for_user ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

# --- UPDATE & DELETE ---

def update_word_review(result: schemas.ReviewResult, user_id: str):
    """Cập nhật tiến trình SRS (thuật toán SM-2)."""
    try:
        # Lấy từ vựng hiện tại
        word_data_res = admin_supabase.table("UserVocabulary").select("interval, ease_factor") \
            .eq("id", result.word_id).eq("user_id", user_id).single().execute()
        word_data = word_data_res.data
        
        if not word_data:
            raise HTTPException(status_code=404, detail="Không tìm thấy từ vựng")
            
        # Tính toán SRS mới
        new_interval, new_ease, new_review_date = calculate_srs(
            quality=result.quality,
            current_interval=word_data['interval'],
            current_ease_factor=word_data['ease_factor']
        )
        
        data_to_update = {
            "interval": new_interval,
            "ease_factor": new_ease,
            "next_review_date": new_review_date.isoformat()
        }
        
        MASTERY_THRESHOLD = 90 
        if new_interval >= MASTERY_THRESHOLD:
            data_to_update["status"] = "mastered"
        else:
            data_to_update["status"] = "learning" 

        admin_supabase.table("UserVocabulary").update(data_to_update) \
            .eq("id", result.word_id).execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def update_word_for_user(word_id: int, word_data: schemas.WordUpdate, user_id: str):
    """
    Cập nhật chi tiết (word, def, context) của một từ vựng.
    """
    try:
        data_to_update = word_data.dict(exclude_unset=True)
        
        if not data_to_update:
            raise HTTPException(status_code=400, detail="Không có thông tin nào để cập nhật")

        if "example" in data_to_update:
            data_to_update["context_sentence"] = data_to_update.pop("example")
            
        if "word" in data_to_update:
            print(f"Từ vựng đã thay đổi, đang tra cứu lại: {data_to_update['word']}")
            word_details = get_word_details_from_api(data_to_update["word"])
            data_to_update["pronunciation"] = word_details.get("pronunciation")
            data_to_update["audio_url"] = word_details.get("audio_url")
            if word_details.get("type"):
                data_to_update["type"] = word_details.get("type")

        response = admin_supabase.table("UserVocabulary").update(data_to_update) \
            .eq("id", word_id).eq("user_id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy từ vựng hoặc không có quyền cập nhật")

        return response.data[0] 
    except Exception as e:
        print(f"--- LỖI THẬT TRONG update_word_for_user ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))


def delete_word_for_user(word_id: int, user_id: str):
    """Xóa một từ vựng."""
    try:
        response = admin_supabase.table("UserVocabulary").delete() \
            .eq("id", word_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy từ vựng hoặc không có quyền xóa")
            
        return {"success": True}
    except Exception as e:
        print(f"--- LỖI THẬT TRONG delete_word_for_user ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
    
# --- AI SUGGESTIONS ---

def create_suggestions_for_user(suggestions: List[schemas.AISuggestionWord], user_id: str):
    """
    Nhận danh sách từ AI và chèn vào bảng WordSuggestions.
    """
    try:
        if not suggestions: return 0
        data_to_insert = []
        for item in suggestions:
            word_data = item.dict() if hasattr(item, 'dict') else item
            
            data_to_insert.append({
                "user_id": user_id,
                "word": word_data.get("word"),
                "type": word_data.get("type"), # Lưu loại từ vào DB
                "definition": word_data.get("definition"),
                "pronunciation": word_data.get("pronunciation"),
                "context_sentence": word_data.get("context_sentence"),
                "audio_url": word_data.get("audio_url")
            })
        
        if not data_to_insert: return 0
        
        response = admin_supabase.table("WordSuggestions").insert(data_to_insert).execute()
        return len(response.data) if response.data else 0
    except Exception as e:
        print(f"Suggestion Insert Error: {e}")
        return 0
    
def add_suggestion_for_user(suggestion_id: int, user_id: str, deck_id: int):
    """Chuyển một từ gợi ý sang MỘT BỘ TỪ (DECK) CỤ THỂ."""
    try:
        suggestion_data = admin_supabase.table("WordSuggestions").select("*") \
            .eq("id", suggestion_id).eq("user_id", user_id).single().execute().data
            
        if not suggestion_data:
            raise HTTPException(status_code=404, detail="Không tìm thấy từ gợi ý")
            
        # Khi chuyển từ gợi ý, cũng TẠO link âm thanh (nếu chưa có)
        word_details = get_word_details_from_api(suggestion_data["word"])
        
        new_word = {
            "user_id": user_id,
            "deck_id": deck_id, 
            "word": suggestion_data["word"],
            "type": suggestion_data.get("type"), # Copy loại từ
            "definition": suggestion_data.get("definition") or suggestion_data.get("meaning"),
            "pronunciation": suggestion_data.get("pronunciation") or word_details.get("pronunciation"),
            "context_sentence": suggestion_data["context_sentence"],
            "audio_url": suggestion_data.get("audio_url") or word_details.get("audio_url"),
            "next_review_date": datetime.utcnow().date().isoformat(),
            "interval": 1, "ease_factor": 2.5, "status": "learning"
        }
        admin_supabase.table("UserVocabulary").insert(new_word).execute()
        
        admin_supabase.table("WordSuggestions").delete().eq("id", suggestion_id).execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- QUIZ GAME HELPERS ---

def get_existing_word_strings(user_id: str, word_list: List[str]) -> List[str]:
    try:
        vocab_words_resp = admin_supabase.table("UserVocabulary").select("word") \
            .eq("user_id", user_id).in_("word", word_list).execute()
        
        suggestion_words_resp = admin_supabase.table("WordSuggestions").select("word") \
            .eq("user_id", user_id).in_("word", word_list).execute()

        existing = [item['word'] for item in vocab_words_resp.data]
        existing.extend([item['word'] for item in suggestion_words_resp.data])
        
        return list(set(existing))
    except Exception as e:
        print(f"--- LỖI THẬT TRONG get_existing_word_strings ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

def find_public_words_data(word_list: List[str]) -> List[dict]:
    try:
        words_data = admin_supabase.table("PublicWords").select("*") \
            .in_("word", word_list).execute().data
        
        found_words = {}
        for word in words_data:
            if word['word'] not in found_words:
                found_words[word['word']] = word
        return list(found_words.values())
    except Exception as e:
        print(f"--- LỖI THẬT TRONG find_public_words_data ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

def bulk_create_word_suggestions(suggestions_data: List[dict]):
    try:
        response = admin_supabase.table("WordSuggestions").insert(suggestions_data).execute()
        return response.data
    except Exception as e:
        print(f"--- LỖI THẬT TRONG bulk_create_word_suggestions ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

def get_words_from_user_deck(deck_id: int, user_id: str) -> List[dict]:
    try:
        try:
            uuid.UUID(user_id)
        except ValueError:
            pass 

        words = admin_supabase.table("UserVocabulary").select("*") \
            .eq("deck_id", deck_id).eq("user_id", user_id).execute().data
        return words
    except Exception as e:
        print(f"--- LỖI THẬT TRONG get_words_from_user_deck ---: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
def insert_quiz_result(data: dict):
    """
    Thực hiện lệnh insert vào bảng UserQuizResults.
    Chỉ trả về response từ Supabase, không xử lý logic.
    """
    response = db_client.table("UserQuizResults").insert(data).execute()
    return response

