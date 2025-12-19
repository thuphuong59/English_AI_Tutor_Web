# fastapi_app/crud/admin_content.py
from typing import List, Dict, Any, Optional

# Tên bảng trong DB (Hãy đảm bảo tên bảng đúng với DB của bạn)
TABLE_DECKS = 'PublicDecks'
TABLE_VOCAB = 'PublicWords' # Hoặc 'vocabularies' tuỳ bạn đặt

# --- DECKS CRUD ---
def get_all_decks(db: Any, search: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        query = db.from_(TABLE_DECKS).select("*").order("created_at", desc=True)
        if search:
            query = query.ilike("name", f"%{search}%")
        
        response = query.execute()
        decks = response.data
        
        # Đếm số từ trong mỗi deck (Optional - nếu cần hiển thị)
        for deck in decks:
            count_res = db.from_(TABLE_VOCAB).select("*", count='exact').eq("deck_id", deck['id']).execute()
            deck['word_count'] = count_res.count if count_res.count else 0
            
        return decks
    except Exception as e:
        print(f"DB Error (get_decks): {e}")
        return []

def create_deck(db: Any, deck_data: dict) -> Dict[str, Any]:
    try:
        response = db.from_(TABLE_DECKS).insert(deck_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"DB Error (create_deck): {e}")
        return None

def update_deck(db: Any, deck_id: str, update_data: dict) -> Dict[str, Any]:
    try:
        response = db.from_(TABLE_DECKS).update(update_data).eq("id", deck_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"DB Error (update_deck): {e}")
        return None

def delete_deck(db: Any, deck_id: str) -> bool:
    try:
        # Xóa từ vựng trong deck trước (nếu không có Cascade delete)
        db.from_(TABLE_VOCAB).delete().eq("deck_id", deck_id).execute()
        # Xóa deck
        response = db.from_(TABLE_DECKS).delete().eq("id", deck_id).execute()
        return True if response.data else False
    except Exception as e:
        print(f"DB Error (delete_deck): {e}")
        return False

# --- VOCABULARY CRUD ---
def get_vocab_by_deck(db: Any, deck_id: int, search: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        query = db.from_(TABLE_VOCAB).select("*").eq("deck_id", deck_id).order("id", desc=True)
        
        if search:
            query = query.ilike("word", f"%{search}%")
        
        data = query.execute().data
        
        # Map dữ liệu (Giữ nguyên logic cũ)
        for item in data:
            if 'definition' in item: item['meaning'] = item['definition']
            if 'pronunciation' in item: item['ipa'] = item['pronunciation']
            if 'context_sentence' in item: item['example_sentence'] = item['context_sentence']
            
        return data
    except Exception as e:
        print(f"DB Error (get_vocab): {e}")
        return []

def create_deck(db: Any, deck_data: dict) -> Dict[str, Any]:
    try:
        if 'image_url' in deck_data: del deck_data['image_url'] 
        if 'is_public' in deck_data: del deck_data['is_public']
        if 'word_count' in deck_data: del deck_data['word_count']
        
        response = db.from_(TABLE_DECKS).insert(deck_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"DB Error (create_deck): {e}")
        return None

def update_deck(db: Any, deck_id: int, update_data: dict) -> Dict[str, Any]:
    try:
        if 'image_url' in update_data: del update_data['image_url']
        if 'is_public' in update_data: del update_data['is_public']
        
        response = db.from_(TABLE_DECKS).update(update_data).eq("id", deck_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"DB Error (update_deck): {e}")
        return None

def delete_vocab(db: Any, vocab_id: str) -> bool:
    try:
        res = db.from_(TABLE_VOCAB).delete().eq("id", vocab_id).execute()
        return True if res.data else False
    except Exception as e:
        return False
    
def create_vocab(db: Any, vocab_data: dict) -> Dict[str, Any]:
    try:
        # Map key từ Schema (Frontend gửi) -> Database
        db_payload = {
            "deck_id": vocab_data.get("deck_id"),
            "word": vocab_data.get("word"),
            "definition": vocab_data.get("meaning") or vocab_data.get("definition"),
            "pronunciation": vocab_data.get("ipa") or vocab_data.get("pronunciation"),
            "context_sentence": vocab_data.get("example_sentence") or vocab_data.get("context_sentence"),
            "audio_url": vocab_data.get("audio_url"),
            "type": vocab_data.get("type")
        }
        # Lọc bỏ giá trị None để tránh lỗi DB
        db_payload = {k: v for k, v in db_payload.items() if v is not None}
        
        response = db.from_(TABLE_VOCAB).insert(db_payload).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"DB Error (create_vocab): {e}")
        return None

def update_vocab(db: Any, vocab_id: int, update_data: dict) -> Dict[str, Any]:
    try:
        # Map key tương tự
        db_payload = {}
        if "word" in update_data: db_payload["word"] = update_data["word"]
        if "meaning" in update_data: db_payload["definition"] = update_data["meaning"]
        if "definition" in update_data: db_payload["definition"] = update_data["definition"]
        if "ipa" in update_data: db_payload["pronunciation"] = update_data["ipa"]
        if "pronunciation" in update_data: db_payload["pronunciation"] = update_data["pronunciation"]
        if "example_sentence" in update_data: db_payload["context_sentence"] = update_data["example_sentence"]
        if "context_sentence" in update_data: db_payload["context_sentence"] = update_data["context_sentence"]
        if "audio_url" in update_data: db_payload["audio_url"] = update_data["audio_url"]
        if "type" in update_data: db_payload["type"] = update_data["type"]

        response = db.from_(TABLE_VOCAB).update(db_payload).eq("id", vocab_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"DB Error (update_vocab): {e}")
        return None

def delete_vocab(db: Any, vocab_id: int) -> bool:
    try:
        response = db.from_(TABLE_VOCAB).delete().eq("id", vocab_id).execute()
        return True if response.data else False
    except Exception as e:
        print(f"DB Error (delete_vocab): {e}")
        return False