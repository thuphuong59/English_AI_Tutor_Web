import os
import json
import re
import requests
import asyncio
from datetime import datetime, timedelta, date
from typing import Any, Dict, List, Set, Optional
from urllib.parse import quote_plus
from fastapi_app import schemas
from fastapi_app.database import db_client, admin_supabase
from fastapi_app.crud import vocabulary as vocab_crud
import google.generativeai  as genai
from fastapi_app.prompts import vocabulary as prompts
from fastapi_app.services import vocabulary
import logging


try:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        model = None
    else:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            'gemini-2.5-flash-preview-09-2025', 
            generation_config={"response_mime_type": "application/json"}
        )
except Exception:
    model = None

# --- SRS LOGIC ---
def calculate_srs(quality: int, current_interval: int, current_ease_factor: float) -> tuple[int, float, date]:
    if quality < 3:
        new_interval = 1
        new_ease_factor = max(1.3, current_ease_factor - 0.2)
    else:
        if current_interval == 1:
            new_interval = 6
        elif current_interval == 6:
            new_interval = int(current_interval * current_ease_factor)
        else:
            new_interval = int(current_interval * current_ease_factor)
        
        new_ease_factor = current_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        if new_ease_factor < 1.3:
            new_ease_factor = 1.3
            
    next_review_date = (datetime.utcnow().date() + timedelta(days=new_interval))
    return new_interval, new_ease_factor, next_review_date

# --- HELPER: TTS & DICTIONARY ---

def get_word_details_from_api(word: str) -> Dict[str, Any]:
    """
    Tra cứu Sync: Google TTS + Dictionary API (Lấy thêm Type)
    """
    pronunciation = None
    audio_url = None
    definition = None
    word_type = None 
    
    safe_word = quote_plus(word)
    
    # 1. Google TTS
    try:
        tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={safe_word}&tl=en&client=tw-ob"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        audio_response = requests.get(tts_url, headers=headers, timeout=10)
        
        if audio_response.status_code == 200:
            audio_bytes = audio_response.content
            file_name = f"{safe_word}_{int(datetime.utcnow().timestamp())}.mp3"
            
            admin_supabase.storage.from_("audio").upload(
                file=audio_bytes,
                path=file_name,
                file_options={"content-type": "audio/mpeg", "upsert": "true"}
            )
            audio_url = admin_supabase.storage.from_("audio").get_public_url(file_name)
    except Exception:
        pass

    # 2. Dictionary API (Lấy Phonetic, Definition VÀ Type)
    try:
        dict_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
        response = requests.get(dict_url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and data:
                item = data[0]
                pronunciation = item.get("phonetic")
                if not pronunciation and item.get("phonetics"):
                    for phone in item["phonetics"]:
                        if phone.get("text"):
                            pronunciation = phone["text"]
                            break
                
                # Lấy Meaning đầu tiên
                if item.get("meanings"):
                    first_meaning = item["meanings"][0]
                    # Lấy Part of Speech (Type)
                    word_type = first_meaning.get("partOfSpeech")
                    
                    if first_meaning.get("definitions"):
                        definition = first_meaning["definitions"][0].get("definition")
    except Exception:
        pass 
        
    return {
        "word": word,
        "pronunciation": pronunciation,
        "audio_url": audio_url,
        "definition": definition,
        "type": word_type 
    }

def _clean_word(word: str) -> str:
    return re.sub(r'[^\w\s-]', '', word).strip().lower()

def _filter_existing_words(user_id: str, candidates: List[str]) -> List[str]:
    try:
        existing_words = vocab_crud.get_existing_word_strings(user_id, candidates)
        return [w for w in candidates if w not in existing_words]
    except Exception:
        return candidates

async def analyze_and_enrich_transcript(transcript_json: List[Dict[str, Any]], user_id: str = None) -> List[schemas.AISuggestionWord]:
    if not transcript_json:
        return []

    candidate_words: Set[str] = set()
    full_transcript_text = ""
    
    print("AI Service: Scanning Summary Suggestions...")

    for item in transcript_json:
        if item.get("role") in ["user", "ai"] and item.get("text"):
            full_transcript_text += f"[{item['role'].upper()}]: {item['text']}\n"
        
        # Chỉ lấy từ 'relevant_vocabulary_suggestions' trong Summary
        if item.get("type") == "summary" and item.get("metadata"):
            suggestions = item["metadata"].get("relevant_vocabulary_suggestions", [])
            if suggestions:
                print(f" -> Found suggestions: {suggestions}")
                for w in suggestions:
                    candidate_words.add(_clean_word(w))

    raw_candidates = list(candidate_words)
    if not raw_candidates:
        return []

    final_candidates = []
    if user_id:
        final_candidates = _filter_existing_words(user_id, raw_candidates)
    else:
        final_candidates = raw_candidates
    
    print(f" -> Unique candidates: {final_candidates}")

    if not final_candidates:
        return []

    # --- 3. Gemini Contextualizer---
    extracted_vocab_data = []

    if model and full_transcript_text:
        try:
            # GỌI HÀM TẠO PROMPT TỪ FILE KHÁC
            prompt = prompts.build_vocab_enrichment_prompt(
                transcript_text=full_transcript_text, 
                candidates=final_candidates
            )
            
            response = await model.generate_content_async(prompt)
            text_res = response.text.strip().replace("```json", "").replace("```", "")
            extracted_vocab_data = json.loads(text_res)
            
        except Exception as e:
            print(f"Gemini Error: {e}")
            # Fallback
            for w in final_candidates:
                extracted_vocab_data.append({"word": w, "type": "unknown", "meaning": None, "context": f"Suggested: {w}"})

    # --- 4. Enrich & TTS ---
    final_results = []

    for item in extracted_vocab_data:
        word = item.get("word")
        if not word: continue
        
        # Tra cứu chi tiết (Dictionary API)
        details = get_word_details_from_api(word)
        
        meaning = item.get("meaning") or details.get("definition") or "Definition not found"
        context = item.get("context") or "No context available"
        
        # Ưu tiên Type từ AI (vì nó hiểu Idiom/Phrasal verb tốt hơn Dictionary API)
        final_type = item.get("type")
        if not final_type or final_type == "unknown":
            final_type = details.get("type") or "vocab"

        final_results.append(schemas.AISuggestionWord(
            word=word,
            type=final_type, 
            definition=meaning,
            pronunciation=details.get("pronunciation"),
            context_sentence=context, 
            audio_url=details.get("audio_url")
        ))

    print(f"Enriched {len(final_results)} words.")
    return final_results

async def check_existing_deck(user_id: str, topic_name: str):
    """Kiểm tra Deck đã tồn tại trên Supabase chưa."""
    response = admin_supabase.table("Decks") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("name", topic_name) \
        .execute()
    return response.data[0] if response.data else None

async def create_new_deck(user_id: str, topic_name: str, lesson_id: Optional[str]):
    if admin_supabase is None:
        raise Exception("Supabase client is not initialized.")
        
    # Chuẩn bị dữ liệu để insert, bao gồm lesson_id
    data_to_insert = {
        "user_id": user_id,
        "name": topic_name,
        "description": f"AI generated for {topic_name}",
        "lesson_id": lesson_id if lesson_id else None # ✅ LƯU lesson_id
    }
    
    try:
        insert_res = admin_supabase.table("Decks").insert(data_to_insert).execute()
        return insert_res.data[0]
        
    except Exception as e:
        print(f"Lỗi khi tạo Deck mới: {e}")
        # Tùy chọn: Log lỗi chi tiết hơn ở đây
        return None
async def get_user_level(user_id: str) -> str:
    """Truy vấn Supabase để lấy Level của người dùng từ bảng roadmaps."""
    try:
        # GIẢ ĐỊNH: Bảng 'roadmaps' có cột 'user_id' và cột 'current_level' (hoặc 'level')
        response = admin_supabase.table("roadmaps") \
            .select("level") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        # Trả về Level (ví dụ: 'A2', 'B1') hoặc 'B1' nếu không tìm thấy
        user_level = response.data.get("level", "B1") 
        return user_level
        
    except Exception as e:
        # Ghi log lỗi và trả về level mặc định
        print(f"Error fetching user level from roadmaps: {e}")
        return "B1" # Default level nếu xảy ra lỗi truy vấn
async def generate_vocab_for_deck_supabase(deck_id: int, topic_name: str, user_id: str):
    """Task ngầm: Gọi AI và Insert dữ liệu hàng loạt."""
    try:
        user_level = await get_user_level(user_id)
        prompt = prompts.build_topic_generation_prompt(topic_name, user_level)
        response = await model.generate_content_async(prompt)
        raw_words = json.loads(response.text.strip().replace("```json", "").replace("```", "")) 
        
        print("-" * 50)
        print(f"DEBUG: STARTING AI TASK (Deck ID: {deck_id})")
        print(f"DEBUG: USER ID: {user_id}")
        print(f"DEBUG: CURRENT LEVEL (i): {user_level}")
        print(f"DEBUG: PROMPT SENT TO GEMINI (i+1 Strategy):")
        print(prompt)
        print("-" * 50)


        vocab_list = []
        for item in raw_words:
            details = get_word_details_from_api(item['word'])
            vocab_list.append({
                "deck_id": deck_id,
                "user_id": user_id,
                "word": item['word'],
                "type": item.get('type') or details.get('type'),
                "definition": item.get('meaning') or details.get('definition'),
                "pronunciation": details.get('pronunciation'),
                "context_sentence": item.get('context'),
                "audio_url": details.get('audio_url')
            })

        if vocab_list:
            admin_supabase.table("UserVocabulary").insert(vocab_list).execute()
    except Exception as e:
        print(f"Service Background Task Error: {e}")

logger = logging.getLogger(__name__)

async def get_existing_deck_by_topic_name(user_id: str, topic_name: str) -> Optional[Dict[str, Any]]:
    if admin_supabase is None:
        logger.error("Supabase client is not initialized.")
        return None
        
    try:
        res = (
            admin_supabase.table("Decks")
            .select("id") # Chỉ cần Deck ID
            .eq("user_id", user_id)
            .eq("name", topic_name) # ✅ Dùng cột 'name' để tìm kiếm theo tên chủ đề
            .limit(1)
            .maybe_single()
            .execute()
        )
        
        if not res.data:
            return None 

        # Nếu tìm thấy, res.data là dictionary của bản ghi Deck
        return res.data 

    except Exception as e:
        logger.error(f"Lỗi khi truy vấn existing deck cho user {user_id} và topic {topic_name}: {e}")
        return None