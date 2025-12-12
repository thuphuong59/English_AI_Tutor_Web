# fastapi_app/services/quiz_grammar_service.py

import json
from typing import List, Dict, Any
from fastapi_app.database import admin_supabase
from fastapi_app.services.user import get_user_level
from fastapi_app.services.assessment_service import get_user_roadmap
from fastapi_app.prompts import grammar as prompts
import google.generativeai as genai
import traceback
import os
import logging
# from google import genai
# from google.genai import types as g_types

# ============================
# INIT MODEL
# ============================
try:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    print(f"DEBUG: Loaded API Key (first 5 chars): {GOOGLE_API_KEY[:5] if GOOGLE_API_KEY else 'NONE'}")
    if not GOOGLE_API_KEY:
        model = None
    else:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            "gemini-2.5-flash-preview-09-2025",
            generation_config={
                "response_mime_type": "application/json"
            }
        )
except Exception:
    model = None
# ============================
# CREATE NEW SESSION
# ============================

async def create_new_quiz_session(user_id: str, topic_name: str, lesson_id: str):
    if admin_supabase is None:
        raise Exception("Supabase not initialized")

    res = admin_supabase.table("QuizSessions").insert({
        "user_id": user_id,
        "topic": topic_name,
        "lesson_id": lesson_id,
        "status": "GENERATING",
        "score": 0.0,
        "total_questions": 0
    }).execute()

    return res.data[0]


# ============================
# CHECK LESSON COMPLETED
# ============================

async def check_if_lesson_completed(user_id: str, lesson_id: str) -> bool:
    if admin_supabase is None:
        return False

    try:
        res = admin_supabase.table("CompletedTopics") \
            .select("count()") \
            .eq("user_id", user_id) \
            .eq("lesson_id", lesson_id) \
            .execute()

        return (res.count or 0) > 0

    except:
        return False


# ============================
# GENERATE QUESTIONS — FIXED
# ============================

async def generate_quiz_questions(session_id: int, topic_name: str, user_id: str):
    if not model or admin_supabase is None:
        print("Model or Supabase missing.")
        return

    try:
        # LEVEL
        current_level = get_user_level(user_id)
        print(f"[DEBUG] User Level: {current_level}")

        # PROMPT
        prompt = prompts.build_quiz_prompt(topic_name, current_level)
        print(f"[DEBUG] Prompt Sent to AI")

        # ===== FIXED HERE =====
        response = await model.generate_content_async(prompt)
        ai_text = response.text
        print(f"[DEBUG] RAW AI RESPONSE: {ai_text}")

        # CLEAN JSON
        ai_text = ai_text.replace("```json", "").replace("```", "").strip()
        raw_questions = json.loads(ai_text)

        # SAVE QUESTION
        to_insert = []
        for q in raw_questions:
            to_insert.append({
                "session_id": session_id,
                "user_id": user_id,
                "question_text": q.get("question"),
                "options": q.get("options"),
                "correct_answer": q.get("answer"),
                "topic": topic_name
            })

        if len(to_insert):
            admin_supabase.table("QuizQuestions").insert(to_insert).execute()

            admin_supabase.table("QuizSessions").update({
                "status": "READY",
                "total_questions": len(to_insert)
            }).eq("id", session_id).execute()

            print(f"[DEBUG] Quiz READY: {len(to_insert)} questions created")

        else:
            print("[WARN] AI returned empty question set")

    except Exception as e:
        print("=" * 60)
        print(f"[ERROR] AI Generation failed (session {session_id}) -> {e}")
        traceback.print_exc()
        print("=" * 60)

        admin_supabase.table("QuizSessions").update({
            "status": "ERROR"
        }).eq("id", session_id).execute()


# ============================
# GRADE & TRACK
# ============================
logger = logging.getLogger(__name__)
MASTERY_THRESHOLD = 0.20 # 80% điểm trở lên được coi là thành thạo

async def grade_and_track_quiz(session_id: int, user_id: str, answers: Dict[int, str]):
    user_id
    if admin_supabase is None:
        raise Exception("Supabase not initialized")

    # 1. GET QUESTIONS & CHẤM ĐIỂM
    # ... (Logic chấm điểm giữ nguyên) ...
    res = admin_supabase.table("QuizQuestions") \
        .select("id, correct_answer, topic") \
        .eq("session_id", session_id).execute()

    db_questions = {q["id"]: q for q in res.data}
    correct = 0
    wrong_topics = set()

    for qid_str, ans in answers.items():
        qid = int(qid_str)
        if qid in db_questions:
            if ans == db_questions[qid]["correct_answer"]:
                correct += 1
            else:
                wrong_topics.add(db_questions[qid]["topic"])

    total = len(db_questions)
    score = correct / total if total else 0

    # 2. XÁC ĐỊNH THÀNH THẠO (MASTERED)
    mastery_achieved = score >= MASTERY_THRESHOLD
    
    # Chuẩn bị báo cáo điểm yếu/khuyến nghị
    session_info_topic = admin_supabase.table("QuizSessions").select("topic").eq("id", session_id).single().execute()
    topic_chinh = session_info_topic.data["topic"]
    
    weak_areas_report = []
    if not mastery_achieved:
        weak_areas_report.append(f"Cần ôn tập: {topic_chinh} (Điểm: {score*100:.0f}%)")
    else:
        weak_areas_report.append("Đã thành thạo chủ đề này.")


    # 3. UPDATE SESSION (Lưu kết quả vào QuizSessions)
    session_info_full = admin_supabase.table("QuizSessions") \
            .select("lesson_id") \
            .eq("id", session_id).single().execute()
            
    # Lấy lesson_id CẦN ĐÁNH DẤU
    lesson_id_to_mark = session_info_full.data.get("lesson_id")
    
    admin_supabase.table("QuizSessions").update({
        "status": "COMPLETED",
        "score": score,
        "weak_areas": weak_areas_report 
    }).eq("id", session_id).execute()

    
    # ================================================================
    # 🚨 BƯỚC 4: CẬP NHẬT TRẠNG THÁI TIẾN ĐỘ VÀO BẢNG roadmaps (HYBRID)
    # ================================================================
    if lesson_id_to_mark:
        try:
            
            session_info = admin_supabase.table("QuizSessions") \
                .select("topic").eq("id", session_id).single().execute()

            admin_supabase.table("CompletedTopics").insert({
                "user_id": user_id,
                "lesson_id": session_info.data["topic"], # "topic" là lesson_id trong context này
                "topic_type": "grammar"
            }).execute()
            
            roadmap_record = get_user_roadmap(user_id)
            logger.debug(f"DEBUG: Loaded Roadmap ID: {roadmap_record.get('id')}")
            logger.debug(f"DEBUG: Data keys: {roadmap_record.get('data', {}).keys()}")
            logger.debug(f"DEBUG: Progress keys: {roadmap_record.get('data', {}).get('user_progress', {}).keys()}") 
# Nếu userProgress nằm trong roadmap:
            logger.debug(f"DEBUG: Progress keys: {roadmap_record.get('data', {}).get('roadmap', {}).get('user_progress', {}).keys()}")
            
            if roadmap_record and roadmap_record.get('data'):
                current_roadmap_data = roadmap_record['data']
                current_progress = current_roadmap_data.get('user_progress', {})
                roadmap_id = roadmap_record.get('id')

                # 4a. Cập nhật trạng thái của lesson_id đó
                if lesson_id_to_mark in current_progress:
                    current_progress[lesson_id_to_mark] = {
                        "completed": mastery_achieved, # Chỉ TRUE nếu đạt 80%
                        "score": round(score * 100), # Lưu điểm dưới dạng %
                        "type": "grammar"
                    }
                    current_roadmap_data['user_progress'] = current_progress # Cập nhật lại đối tượng userProgress
                else:
                    logger.warning(f"Lesson ID {lesson_id_to_mark} not found in userProgress map.")

                # 4b. Lưu lại toàn bộ bản ghi roadmaps
                if roadmap_id:
                    admin_supabase.table("roadmaps") \
                        .update({"data": current_roadmap_data}) \
                        .eq("id", roadmap_id) \
                        .execute()
                    
                    logger.info(f"✅ [PROGRESS TRACKED] Grammar {lesson_id_to_mark} updated in roadmaps.")

            else:
                logger.warning(f"Roadmap not found for user {user_id} to update progress.")

        except Exception as e:
            logger.error(f"❌ Lỗi khi cập nhật progress cho Grammar: {e}")
            # Vẫn cho phép giao dịch chính hoàn tất
    
    
    return {
        "score_percent": score,
        "correct_count": correct,
        "total_questions": total,
        "mastery_achieved": mastery_achieved, 
        "weak_areas": weak_areas_report,
        "lesson_id": lesson_id_to_mark 
    }