# fastapi_app/services/quiz_grammar_service.py

import json
from typing import List, Dict, Any
from fastapi_app.database import admin_supabase
from fastapi_app.services.user import get_user_level
from fastapi_app.prompts import grammar as prompts
import google.generativeai as genai
import traceback
import os

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

async def grade_and_track_quiz(session_id: int, user_id: str, answers: Dict[int, str]):
    if admin_supabase is None:
        raise Exception("Supabase not initialized")

    # GET QUESTIONS
    res = admin_supabase.table("QuizQuestions") \
        .select("id, correct_answer, topic") \
        .eq("session_id", session_id).execute()

    db_questions = {q["id"]: q for q in res.data}
    correct = 0
    wrong_topics = set()

    for qid, ans in answers.items():
        qid = int(qid)
        if qid in db_questions:
            if ans == db_questions[qid]["correct_answer"]:
                correct += 1
            else:
                wrong_topics.add(db_questions[qid]["topic"])

    total = len(db_questions)
    score = correct / total if total else 0

    # UPDATE SESSION
    admin_supabase.table("QuizSessions").update({
        "status": "COMPLETED",
        "score": score,
        "weak_areas": list(wrong_topics)
    }).eq("id", session_id).execute()

    # Mark completed
    session_info = admin_supabase.table("QuizSessions") \
        .select("topic").eq("id", session_id).single().execute()

    admin_supabase.table("CompletedTopics").insert({
        "user_id": user_id,
        "lesson_id": session_info.data["topic"],
        "topic_type": "grammar"
    }).execute()

    return {
        "score_percent": score,
        "correct_count": correct,
        "total_questions": total,
        "weak_areas": list(wrong_topics)
    }
