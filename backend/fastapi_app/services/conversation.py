import os
import json
import google.generativeai as genai
from fastapi import UploadFile, HTTPException
from typing import Optional, List, Dict, Any

from fastapi_app.database import admin_supabase
from fastapi_app.crud import history as crud_history
from fastapi_app.crud import scenarios as crud_scenarios
from fastapi_app.utils.gemini_file_manager import upload_audio_to_gemini
from fastapi_app.prompts import conversation as prompts
from fastapi_app.services import assessment_service
import anyio
import logging

# --- Config ---
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found.")
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-preview-09-2025"
try:
    chat_model = genai.GenerativeModel(MODEL_NAME)
    summary_model = genai.GenerativeModel(MODEL_NAME)
except Exception as e:
    print(f"Gemini Init Error: {e}")
    raise e

# --- Wrappers ---
def get_all_sessions(user_id: str):
    return crud_history.get_sessions(admin_supabase, user_id)

def get_session_details(session_id: str):
    return crud_history.get_session_details(admin_supabase, session_id)

def get_scenarios_for_topic(topic: str, level: str):
    return crud_scenarios.get_scenarios_by_topic_and_level(admin_supabase, topic, level)

def delete_session(session_id: str, user_id: str):
    crud_history.delete_session(admin_supabase, session_id, user_id)

# --- START ---
async def start_conversation(mode: str, level: str, scenario_id: Optional[str], topic: Optional[str], user_id: str, lesson_id: Optional[str] = None):
    print(f"DEBUG: Lesson ID nhận được từ Router: {lesson_id}")
    topic_to_save = topic
    greeting_text = ""
    user_suggestions = []

    if mode == "scenario":
        if not scenario_id:
            raise HTTPException(400, "Scenario ID required.")
        scenario = crud_scenarios.get_scenario_by_id_with_dialogues(admin_supabase, scenario_id)
        if not scenario:
            raise HTTPException(404, "Scenario not found.")
        topic_to_save = scenario["title"]
        if scenario.get("dialogue_lines"):
            greeting_text = scenario["dialogue_lines"][0]["line"]
            user_suggestions = [l["line"] for l in scenario["dialogue_lines"] if l["speaker"] == "user"]
    else:
        if not topic: raise HTTPException(400, "Topic required.")
        
        prompt = prompts.get_start_conversation_prompt(level, topic)
        try:
            response = await chat_model.generate_content_async(prompt)
            greeting_text = response.text.strip()
        except Exception:
            greeting_text = f"Hi! Let's talk about {topic}. How are you?"

    session = crud_history.create_session(admin_supabase, mode, level, topic_to_save, user_id, lesson_id)
    crud_history.append_message_to_history(admin_supabase, session["id"], {
        "role": "ai", "text": greeting_text, "type": "greeting", "metadata": {}
    })
    return {"greeting": greeting_text, "suggestions": user_suggestions, "session_id": session["id"]}

# --- FREE TALK TEXT ---
async def generate_free_talk_reply(message: str, topic: str, level: str, session_id: str):
    crud_history.append_message_to_history(admin_supabase, session_id, {"role": "user", "text": message, "type": "text"})
    
    session_data = crud_history.get_session_details(admin_supabase, session_id)
    messages = session_data.get("messages", [])
    context_text = "\n".join(f"{m['role']}: {m.get('text','')}" for m in messages[-8:])


    full_prompt = prompts.get_free_talk_text_prompt(level, topic, context_text, message)
    
    try:
        result = await chat_model.generate_content_async(full_prompt)
        parsed = json.loads(result.text.strip().replace("```json", "").replace("```", ""))
    except Exception:
        parsed = {"reply": "Error generating reply.", "feedback": "", "metadata": {}}

    crud_history.append_message_to_history(admin_supabase, session_id, {"role": "ai", "text": parsed.get("feedback"), "type": "feedback", "metadata": parsed.get("metadata")})
    crud_history.append_message_to_history(admin_supabase, session_id, {"role": "ai", "text": parsed.get("reply"), "type": "reply"})

    return parsed

# --- FREE TALK VOICE ---
async def process_free_talk_voice(audio: UploadFile, topic: str, level: str, session_id: str):
    gemini_file = await upload_audio_to_gemini(audio)

    session_data = crud_history.get_session_details(admin_supabase, session_id)
    messages = session_data.get("messages", [])
    context_text = "\n".join(f"{m['role']}: {m.get('text','')}" for m in messages[-6:])

    prompt = prompts.get_free_talk_voice_prompt(level, topic, context_text)

    try:
        response = await chat_model.generate_content_async([prompt, gemini_file])
        text_res = response.text.strip().replace("```json", "").replace("```", "")
        parsed = json.loads(text_res)
    except Exception as e:
        print(f"Gemini FreeTalk Error: {e}")
        parsed = {
            "transcribed_text": "(Audio Error)", "reply": "Sorry, audio error.", "feedback": "", "metadata": {}
        }

    # Save DB...
    crud_history.append_message_to_history(admin_supabase, session_id, {
        "role": "user", "text": parsed.get("transcribed_text"), "type": "speech"
    })
    crud_history.append_message_to_history(admin_supabase, session_id, {
        "role": "ai", "text": parsed.get("feedback"), "type": "feedback", "metadata": parsed.get("metadata")
    })
    crud_history.append_message_to_history(admin_supabase, session_id, {
        "role": "ai", "text": parsed.get("reply"), "type": "reply"
    })
    return parsed

# --- SCENARIO VOICE ---
async def evaluate_scenario_voice(audio: UploadFile, scenario_id: str, level: str, turn: int, session_id: str):
    gemini_file = await upload_audio_to_gemini(audio)

    scenario = crud_scenarios.get_scenario_by_id_with_dialogues(admin_supabase, scenario_id)
    if not scenario: raise HTTPException(404, "Scenario not found")
    
    correct_line = next((l for l in scenario["dialogue_lines"] if l["turn"] == turn and l["speaker"] == "user"), None)
    correct_text = correct_line["line"] if correct_line else "(No expected line)"

    prompt = prompts.get_scenario_voice_prompt(level, correct_text)

    try:
        response = await chat_model.generate_content_async([prompt, gemini_file])
        text_res = response.text.strip().replace("```json", "").replace("```", "")
        parsed = json.loads(text_res)
    except Exception as e:
        print(f"Gemini Scenario Error: {e}")
        parsed = {
            "transcribed_text": "(Audio Error)", "immediate_feedback": "Error.", "metadata": {}
        }

    crud_history.append_message_to_history(admin_supabase, session_id, {
        "role": "user", "text": parsed.get("transcribed_text"), "type": "speech"
    })
    crud_history.append_message_to_history(admin_supabase, session_id, {
        "role": "ai", "text": parsed.get("immediate_feedback"), "type": "feedback", "metadata": parsed.get("metadata")
    })

    next_ai_line = next((l for l in scenario["dialogue_lines"] if l["turn"] == turn + 1 and l["speaker"] == "ai"), None)
    next_ai_text = next_ai_line["line"] if next_ai_line else "Scenario completed!"
    
    crud_history.append_message_to_history(admin_supabase, session_id, {
        "role": "ai", "text": next_ai_text, "type": "reply"
    })

    next_user_line = next((l for l in scenario["dialogue_lines"] if l["turn"] == turn + 2 and l["speaker"] == "user"), None)
    next_user_text = next_user_line["line"] if next_user_line else None

    return {
        "transcribed_text": parsed.get("transcribed_text"),
        "immediate_feedback": parsed.get("immediate_feedback"),
        "next_ai_reply": next_ai_text,
        "next_user_suggestion": next_user_text,
        "is_complete": not bool(next_user_text),
        "metadata": parsed.get("metadata")
    }

# --- SUMMARIZE ---

# Hàm hỗ trợ tính điểm trung bình (Chỉ tính các điểm số có giá trị)
def calculate_average_score(metadata: Dict[str, Any]) -> float:
    scores = []
    
    grammar_score = metadata.get("grammar")
    vocabulary_score = metadata.get("vocabulary")
    pronunciation_score = metadata.get("pronunciation")
    
    # Chỉ thêm vào list nếu giá trị là số (float hoặc int)
    if isinstance(grammar_score, (float, int)) and grammar_score is not None:
        scores.append(grammar_score)
    if isinstance(vocabulary_score, (float, int)) and vocabulary_score is not None:
        scores.append(vocabulary_score)
    if isinstance(pronunciation_score, (float, int)) and pronunciation_score is not None:
        scores.append(pronunciation_score)
        
    if scores:
        return sum(scores) / len(scores)
    return 0.0

logger = logging.getLogger(__name__)
CONVERSATION_MASTERY_THRESHOLD = 0.80 
MAX_ATTEMPTS = 4
async def summarize_conversation(session_id: str, topic: str, level: str, messages: Optional[List[Dict[str, Any]]] = None):
    
    session_data = crud_history.get_session_details(admin_supabase, session_id)
    if not session_data: 
        raise HTTPException(404, "Session not found")
    
    # 1. Lấy dữ liệu cần thiết
    lesson_id_to_mark = session_data.get("lesson_id")
    user_id = session_data.get("user_id")
    mode = session_data.get("mode", "free")
    
    if not messages: messages = session_data.get("messages", [])
    session_already_summarized = any(m.get('type') == 'summary' for m in session_data.get('messages', []))

    # 2. Logic tạo transcript (ĐÃ HOÀN CHỈNH)
    transcript_lines = []
    for m in messages:
        role = m.get('role', '').upper()
        text = m.get('text', '')
        msg_type = m.get('type', '')
        metadata = m.get('metadata') or {}

        if role == 'SYSTEM': continue
        if role == 'USER': transcript_lines.append(f"[USER]: {text}")
        elif msg_type == 'feedback':
            # Chỉ log feedback chi tiết nếu có điểm/metadata liên quan
            pron_score = metadata.get('pronunciation_score', 'N/A')
            transcript_lines.append(f"   >>> [LOG]: Pronunciation={pron_score} | Feedback='{text}'")
        elif role == 'AI': transcript_lines.append(f"[AI]: {text}")
    
    transcript = "\n".join(transcript_lines)
    if not transcript.strip(): return {"summary_text": "No content.", "summary_metadata": {}}

    parsed = {"summary_text": "Error/Already summarized.", "summary_metadata": {}}
    
    if not session_already_summarized:
        prompt = prompts.get_summary_prompt(mode, level, topic, transcript)
        
        try:
            res = await summary_model.generate_content_async(prompt)
            text_res = res.text.strip().replace("```json", "").replace("```", "")
            parsed = json.loads(text_res)
        except Exception as e:
            # logger.error(f"Gemini Summarize Error: {e}") 
            parsed = {"summary_text": "Error summarizing.", "summary_metadata": {}}
        
        # 3. LƯU summary VÀO DB
        updated_msgs = messages + [{"role": "ai", "text": parsed.get("summary_text"), "type": "summary", "metadata": parsed.get("summary_metadata")}]
        crud_history.update_session_summary(admin_supabase, session_id, parsed.get("summary_text"), updated_msgs)
        
    else:
        # Lấy metadata cũ nếu đã có summary
        last_summary = next((m for m in reversed(session_data.get('messages', [])) if m.get('type') == 'summary'), {})
        parsed = {
            'summary_text': last_summary.get('text', 'Already summarized.'),
            'summary_metadata': last_summary.get('metadata', {})
        }


    # ==========================================================
    # 🚨 FIX TÍNH NĂNG: TÍNH ĐIỂM TỔNG HỢP VÀ CẬP NHẬT ROADMAP
    # ==========================================================


    if lesson_id_to_mark and user_id and mode in ["free", "scenario"] and not session_already_summarized:
            
            summary_metadata = parsed.get("summary_metadata", {})
            overall_score = calculate_average_score(summary_metadata) # Tính trung bình 3 điểm (Giả định CONVERSATION_MASTERY_THRESHOLD tồn tại)
            mastery_achieved = overall_score >= CONVERSATION_MASTERY_THRESHOLD

            try:
                # 4. Lấy bản ghi Roadmap hiện tại
                roadmap_record = await anyio.to_thread.run_sync(
                    assessment_service.get_user_roadmap, 
                    user_id 
                )
                
                if roadmap_record and isinstance(roadmap_record, dict) and roadmap_record.get('data'):
                    
                    current_roadmap_data = roadmap_record['data']
                    current_progress = current_roadmap_data.get('user_progress', {})
                    roadmap_id = roadmap_record.get('id')

                    # 5a. LẤY TRẠNG THÁI CŨ & TÍNH LƯỢT THỬ
                    task_progress = current_progress.get(lesson_id_to_mark, {"type": "speaking"}) 
                    current_attempt = task_progress.get("attempt_count", 0) + 1
                    
                    # Xác định trạng thái mới
                    new_status = "PENDING"
                    if mastery_achieved:
                        new_completed = True
                        new_status = "SUCCESS"
                    elif current_attempt >= MAX_ATTEMPTS:
                        new_completed = False
                        new_status = "END_OF_ATTEMPTS"
                    else:
                        new_completed = False
                        new_status = "PENDING"

                    # 5b. Cập nhật trạng thái của lesson_id đó
                    score_percentage = round(overall_score * 100)
                    
                    update_data = {
                        **task_progress,
                        "completed": new_completed, 
                        "score": score_percentage, 
                        "attempt_count": current_attempt, # 🚨 TRƯỜNG MỚI
                        "status": new_status,              # 🚨 TRƯỜNG MỚI
                        "type": "speaking" 
                    }

                    current_progress[lesson_id_to_mark] = update_data
                    current_roadmap_data['user_progress'] = current_progress

                    # 6. Lưu lại toàn bộ bản ghi roadmaps
                    if roadmap_id:
                        # 🚨 SỬA LỖI CÚ PHÁP run_sync: Gọi execute() bên trong hàm đồng bộ
                        def db_update_sync():
                            return admin_supabase.table("roadmaps") \
                                .update({"data": current_roadmap_data}) \
                                .eq("id", roadmap_id) \
                                .execute()
                                
                        await anyio.to_thread.run_sync(db_update_sync)
                        
                        # Kiểm tra hoàn thành tuần
                        try:
                            week_id = assessment_service.get_week_id_from_lesson_id(lesson_id_to_mark)
                            is_week_resolved = assessment_service.check_week_completion(current_progress, week_id) 
                            
                            if is_week_resolved:
                                # Trigger weekly assessment (Giả định assessment_service.weekly_assessment là hàm async)
                                # await assessment_service.weekly_assessment(user_id, current_roadmap_data)
                                logger.info(f"🚨 WEEK {week_id} COMPLETED/RESOLVED. KÍCH HOẠT weekly_assessment.")
                                pass
                        except Exception as e:
                            logger.warning(f"Lỗi khi kiểm tra hoàn thành tuần (Speaking): {e}")
                            pass
                        
                    # else: roadmap_id không tồn tại, bỏ qua cập nhật

            except Exception as e:
                # logger.error(f"Lỗi trong quá trình cập nhật Roadmap (Conversation): {e}")
                pass # Vẫn trả về parsed dù cập nhật roadmap thất bại

    return parsed