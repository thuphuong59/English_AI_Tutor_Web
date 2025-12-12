from fastapi import HTTPException
from typing import Any, Dict, List
import random
import re

from fastapi_app.schemas.decks import QuizResultCreate
from fastapi_app.crud import decks as decks_crud 
from fastapi_app.crud import vocabulary as vocab_crud
import logging
from fastapi_app.database import admin_supabase
from fastapi_app.services import assessment_service
import anyio
# --- CẤU HÌNH QUIZ ---
TOTAL_QUESTIONS = 10
NUM_MC_C2V = 4
NUM_TYPE_D2V = 2

# === HÀM HELPER 1: Tạo Game 1 (Trắc nghiệm: Từ -> Nghĩa) ===
def _create_mc_v2d_question(correct_word: Dict[str, Any], word_pool: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Tạo câu hỏi Trắc nghiệm: Từ -> Nghĩa"""
    
    # BƯỚC 1 (QUAN TRỌNG): Lọc ra danh sách các từ sai (candidates) TRƯỚC
    candidates = [
        w for w in word_pool 
        if w['id'] != correct_word['id'] and w.get('definition')
    ]
    
    # BƯỚC 2: Chọn ngẫu nhiên từ danh sách đã lọc
    # Lấy tối đa 3 từ, hoặc ít hơn nếu không đủ
    num_to_sample = min(len(candidates), 3)
    selected_candidates = random.sample(candidates, num_to_sample)
    
    distractors = [w['definition'] for w in selected_candidates]
    
    # Fallback: Chỉ chạy nếu bộ từ vựng quá nhỏ (< 4 từ)
    while len(distractors) < 3:
        distractors.append("Incorrect definition placeholder")
        
    options = [correct_word['definition']] + distractors
    random.shuffle(options)
    
    return {
        "word": correct_word['word'],
        "type": "MC_V2D", 
        "questionText": correct_word['word'], 
        "options": options,
        "correctAnswer": correct_word['definition'] 
    }

# === HÀM HELPER 2: Tạo Game 2 (Trắc nghiệm: Điền vào Chỗ trống) ===
def _create_mc_c2v_question(correct_word: Dict[str, Any], word_pool: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Tạo câu hỏi Trắc nghiệm: Điền vào Chỗ trống"""
    sentence = correct_word.get('context_sentence')
    
    # Fallback: Nếu từ này không có câu ngữ cảnh, chuyển nó thành Game 1
    if not sentence:
        return _create_mc_v2d_question(correct_word, word_pool)
        
    placeholder = "[...]" # Làm đẹp placeholder
    question_text = re.sub(
        rf"\b{re.escape(correct_word['word'])}\b", 
        placeholder, 
        sentence, 
        flags=re.IGNORECASE
    )
    
    # BƯỚC 1 (QUAN TRỌNG): Lọc ra danh sách các từ sai (candidates) TRƯỚC
    candidates = [
        w for w in word_pool 
        if w['id'] != correct_word['id']
    ]
    
    # BƯỚC 2: Chọn ngẫu nhiên từ danh sách đã lọc
    num_to_sample = min(len(candidates), 3)
    selected_candidates = random.sample(candidates, num_to_sample)
    
    distractors = [w['word'] for w in selected_candidates]

    # Fallback
    while len(distractors) < 3:
        distractors.append("incorrect word")
        
    options = [correct_word['word']] + distractors
    random.shuffle(options)
    
    return {
        "word": correct_word['word'],
        "type": "MC_C2V", 
        "questionText": question_text, 
        "options": options,
        "correctAnswer": correct_word['word'] 
    }

# === HÀM HELPER 3: Tạo Game 3 (Tự luận: Nghĩa -> Từ) ===
def _create_type_d2v_question(correct_word: Dict[str, Any]) -> Dict[str, Any]:
    """Tạo câu hỏi Tự luận: Nghĩa -> Từ"""
    return {
        "word": correct_word['word'],
        "type": "TYPE_D2V", 
        "questionText": correct_word['definition'], 
        "options": None, 
        "correctAnswer": correct_word['word'] 
    }

# === HÀM SERVICE CHÍNH 1: TẠO QUIZ ===
def create_smart_quiz(deck_type: str, deck_id: int, user_id: str):
    """
    Tạo một bộ câu hỏi game "thông minh" (Ý TƯỞNG 2).
    """
    try:
        all_words_in_set = []
        
        if deck_type == "public":
            deck_details = decks_crud.get_public_deck_details(deck_id)
            all_words_in_set = deck_details['words']
        elif deck_type == "user":
            all_words_in_set = vocab_crud.get_words_from_user_deck(deck_id, user_id)
        else:
            raise HTTPException(status_code=400, detail="Loại bộ từ không hợp lệ")

        if not all_words_in_set:
            raise HTTPException(status_code=404, detail="Không tìm thấy bộ từ hoặc bộ từ trống")
        
        # Yêu cầu tối thiểu 4 từ để tạo đủ 3 phương án sai + 1 đúng
        if len(all_words_in_set) < 4:
            raise HTTPException(status_code=400, detail="Bộ từ phải có ít nhất 4 từ vựng để tạo Quiz.")

        words_with_context = [
            w for w in all_words_in_set 
            if w.get('context_sentence') and w.get('definition')
        ]
        words_no_context = [
            w for w in all_words_in_set 
            if not w.get('context_sentence') and w.get('definition') and w not in words_with_context
        ]
        
        final_quiz_questions = []
        
        # 4. TẠO GAME 2 (Ưu tiên từ có ngữ cảnh)
        words_for_game_2 = random.sample(
            words_with_context, 
            min(NUM_MC_C2V, len(words_with_context))
        )
        for word in words_for_game_2:
            final_quiz_questions.append(
                _create_mc_c2v_question(word, all_words_in_set)
            )
            
        # 5. TẠO GAME 3 (Ưu tiên từ không có ngữ cảnh)
        # Tạo pool còn lại bằng cách loại bỏ những từ đã dùng trong Game 2
        remaining_pool = [w for w in words_with_context if w not in words_for_game_2] + words_no_context
        
        words_for_game_3 = random.sample(
            remaining_pool,
            min(NUM_TYPE_D2V, len(remaining_pool))
        )
        for word in words_for_game_3:
            final_quiz_questions.append(_create_type_d2v_question(word))

        # 6. TẠO GAME 1 (Lấy phần còn lại)
        num_game1_needed = TOTAL_QUESTIONS - len(final_quiz_questions)
        
        # Pool cho Game 1 là tất cả những từ chưa dùng ở Game 2 và 3
        pool_for_game_1 = [
            w for w in remaining_pool 
            if w not in words_for_game_3 and w.get('definition')
        ]
        
        # Nếu không đủ từ mới hoàn toàn, lấy ngẫu nhiên từ toàn bộ tập (chấp nhận lặp lại từ nhưng khác kiểu câu hỏi)
        # để đảm bảo đủ 10 câu
        if len(pool_for_game_1) < num_game1_needed:
             # Lấy thêm từ pool chung để bù vào, loại trừ những từ đã có trong pool_for_game_1
             needed = num_game1_needed - len(pool_for_game_1)
             available_extras = [w for w in all_words_in_set if w not in pool_for_game_1 and w.get('definition')]
             if available_extras:
                 extras = random.sample(available_extras, min(len(available_extras), needed))
                 pool_for_game_1.extend(extras)

        words_for_game_1 = random.sample(
            pool_for_game_1,
            min(num_game1_needed, len(pool_for_game_1))
        )
        for word in words_for_game_1:
            final_quiz_questions.append(
                _create_mc_v2d_question(word, all_words_in_set)
            )
            
        random.shuffle(final_quiz_questions)
        return final_quiz_questions
        
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"--- LỖI THẬT TRONG create_smart_quiz ---: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

# === SERVICE CHÍNH 2: XỬ LÝ FEEDBACK (Ý TƯỞNG 3) ===
def process_quiz_feedback(user_id: str, missed_words: List[str]) -> dict:
    """
    Xử lý các từ sai từ quiz và thêm vào WordSuggestions.
    """
    try:
        existing = vocab_crud.get_existing_word_strings(user_id, missed_words)
        new_words_to_suggest = list(set(missed_words) - set(existing))
        
        if not new_words_to_suggest:
            return {"status": "success", "added": 0, "message": "No new words to add."}

        word_data_list = vocab_crud.find_public_words_data(new_words_to_suggest)

        suggestions_to_create = []
        for w in word_data_list:
            if w['word'] in new_words_to_suggest:
                suggestions_to_create.append({
                    "user_id": user_id,
                    "word": w['word'],
                    "type": w.get('type'),
                    "definition": w['definition'],
                    "pronunciation": w.get('pronunciation'),
                    "context_sentence": w.get('context_sentence'),
                    "audio_url": w.get('audio_url')
                })

        if suggestions_to_create:
            vocab_crud.bulk_create_word_suggestions(suggestions_to_create)
        
        return {"status": "success", "added": len(suggestions_to_create)}
        
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"--- LỖI THẬT TRONG process_quiz_feedback ---: {e}") 
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")

async def process_save_quiz_result(result_data: QuizResultCreate, user_id: str):
    """
    Xử lý logic tính toán điểm và gọi CRUD để lưu. (Không gọi Roadmap).
    """
    try:
        # Tính phần trăm điểm
        percentage = 0.0
        if result_data.total_questions > 0:
            percentage = (result_data.score / result_data.total_questions) * 100

        #  (Data Preparation)
        data_to_insert = {
            "user_id": user_id,
            "deck_id": result_data.deck_id,
            "score": result_data.score,
            "total_questions": result_data.total_questions,
            "percentage": round(percentage, 2),
            "lesson_id": result_data.lesson_id # ✅ ĐÃ THÊM: Lưu lesson_id vào bảng lịch sử
        }
        
        # Gọi hàm CRUD để lưu kết quả
        response = vocab_crud.insert_quiz_result(data_to_insert)

        if not response.data:
            raise HTTPException(status_code=500, detail="Lỗi: Không thể lưu kết quả vào database (No data returned).")

        return True

    except Exception as e:
        logger.error(f"Service Error [process_save_quiz_result]: {e}")
        raise e

# =================================================================
# 🚨 HÀM MỚI: XỬ LÝ TOÀN BỘ QUÁ TRÌNH HOÀN TẤT QUIZ (ORCHESTRATOR)


logger = logging.getLogger(__name__)

MASTERY_THRESHOLD = 0.2 
async def process_quiz_completion(user_id: str, result_data: QuizResultCreate):
    """
    Hàm điều phối cho Quiz Vocabulary: Tính điểm, lưu lịch sử, 
    và cập nhật Roadmap TRỰC TIẾP bằng cách thao tác DB.
    """
    try:
        if admin_supabase is None:
            raise HTTPException(status_code=500, detail="Lỗi DB: Supabase client không khả dụng.")
            
        # 1. TÍNH ĐIỂM SỐ VÀ MASTERY
        if result_data.total_questions is None or result_data.total_questions == 0:
            score = 0.0
        else:
            score = result_data.score / result_data.total_questions
        
        mastery_achieved = score >= MASTERY_THRESHOLD
        lesson_id_to_mark = result_data.lesson_id

        # 🚨 DEBUG 1: Kiểm tra điều kiện đầu vào
        logger.info(f"DEBUG INPUT: Lesson={lesson_id_to_mark}, Score={score:.2f}, Mastery={mastery_achieved}")

        # 2. LƯU LỊCH SỬ QUIZ CHI TIẾT 
        await process_save_quiz_result(result_data, user_id) 

        # 3. CẬP NHẬT ROADMAP (LOGIC GỘP)
        if lesson_id_to_mark and mastery_achieved:
            logger.info(f"Triggering direct roadmap update for {lesson_id_to_mark} (Voca). Score: {score}")

            # 3a. Lấy bản ghi Roadmap hiện tại (Sử dụng run_sync vì hàm là def)
            roadmap_record = await anyio.to_thread.run_sync(
                assessment_service.get_user_roadmap, # Hàm def cần chạy
                user_id # Đối số truyền vào hàm
            )
            
            # 🚨 DEBUG 2: Kiểm tra dữ liệu Roadmap nhận được
            if roadmap_record is False: # Nếu get_user_roadmap trả về False khi lỗi DB
                 logger.error(f"DEBUG ROADMAP: get_user_roadmap returned False (DB connection failed).")
                 return {"status": "error", "message": "Failed to fetch roadmap data."}

            if roadmap_record and isinstance(roadmap_record, dict) and roadmap_record.get('data'):
                
                # 🚨 DEBUG 3: Xác nhận tiến hành cập nhật
                logger.info(f"DEBUG ROADMAP: Proceeding to update Roadmap ID {roadmap_record.get('id')}")
                
                current_roadmap_data = roadmap_record['data']
                current_progress = current_roadmap_data.get('user_progress', {})
                roadmap_id = roadmap_record.get('id')

                # 3b. Cập nhật trạng thái của lesson_id đó
                update_data = {
                    "completed": mastery_achieved, 
                    "score": round(score * 100), 
                    "type": "vocabulary"
                }

                current_progress[lesson_id_to_mark] = update_data
                current_roadmap_data['user_progress'] = current_progress

                # 3c. Lưu lại toàn bộ bản ghi roadmaps
                if roadmap_id:
                    admin_supabase.table("roadmaps") \
                        .update({"data": current_roadmap_data}) \
                        .eq("id", roadmap_id) \
                        .execute()
                    
                    logger.info(f"✅ [PROGRESS TRACKED] Vocabulary {lesson_id_to_mark} updated successfully.")
            else:
                logger.warning(f"Roadmap data not valid or not found for user {user_id}. Skipping roadmap update.")

        return {"status": "success"}

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Lỗi trong quá trình hoàn tất Quiz Vocabulary (Gộp Logic): {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi hoàn tất bài Quiz: {str(e)}")