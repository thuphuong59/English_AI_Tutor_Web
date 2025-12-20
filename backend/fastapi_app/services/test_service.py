
from ..schemas.test_schemas import PreferenceData, InitialQuizResponse, QuizQuestion
import json
from typing import List
from google import genai
from google.genai import types as g_types
from google.genai.errors import APIError 
from starlette.concurrency import run_in_threadpool
import os
from dotenv import load_dotenv
from fastapi_app.prompts.test import build_quiz_test_prompt

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_CHAT_MODEL", "gemini-1.5-flash")

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except:
    client = None


# ================================================================
#  VALIDATOR CỰC MẠNH — RÀNG BUỘC CHẶT CHẼ ĐẦU RA CỦA GEMINI
# ================================================================
def validate_quiz_questions(questions: List[QuizQuestion]):
    allowed_types = {"grammar", "vocabulary", "speaking_prompt"}

    if len(questions) != 21:
        raise ValueError(f"Quiz phải có đúng 21 câu hỏi, nhận được {len(questions)}")

    for idx, q in enumerate(questions, start=1):

        # 1️⃣ ID phải đúng số thứ tự
        if q.id != idx:
            raise ValueError(
                f"ID câu hỏi không hợp lệ: expected {idx}, nhận {q.id}"
            )

        # 2️⃣ question_type đúng chuẩn
        if q.question_type not in allowed_types:
            raise ValueError(
                f"question_type sai tại câu {q.id}: {q.question_type} "
                f"(chỉ cho phép {allowed_types})"
            )

        # 3️⃣ Nếu là SPEAKING
        if q.question_type == "speaking_prompt":
            if q.options != []:
                raise ValueError(
                    f"Câu {q.id}: speaking_prompt phải có options = [], nhưng nhận {q.options}"
                )

            if q.correct_answer_key != "N/A":
                raise ValueError(
                    f"Câu {q.id}: speaking_prompt phải có correct_answer_key='N/A'."
                )

            continue

        # 4️⃣ Nếu là MCQ
        if len(q.options) != 4:
            raise ValueError(
                f"Câu {q.id} phải có 4 lựa chọn, nhưng nhận {len(q.options)}"
            )

        for opt in q.options:
            if any(prefix in opt for prefix in ["A)", "B)", "C)", "D)"]):
                raise ValueError(
                    f"Câu {q.id}: lựa chọn không được chứa A), B), C), D). "
                    f"Hãy trả về nội dung thuần, ví dụ 'Apple'."
                )

        if q.correct_answer_key not in {"A", "B", "C", "D"}:
            raise ValueError(
                f"Câu {q.id}: correct_answer_key phải là A/B/C/D, nhận {q.correct_answer_key}"
            )


# ================================================================
#  HÀM TẠO QUIZ — BAO GỒM VALIDATE
# ================================================================
async def generate_initial_quiz(prefs: PreferenceData) -> InitialQuizResponse:
    if client is None:
        raise ValueError("Gemini client không hoạt động.")

    comm_goal = prefs.communication_goal
    barrier = prefs.confidence_barrier
    commitment = prefs.daily_commitment
    target_duration = prefs.target_duration

    prompt = build_quiz_test_prompt(comm_goal=comm_goal,
                                   barrier=barrier, commitment=commitment,
                                   target_duration=target_duration)
    # f"""
    #     SYSTEM ROLE: Senior English Assessment Developer.
    #     TASK: Generate a diagnostic test JSON based on the learner profile below.

    #     LEARNER PROFILE:
    #     - Goal: {comm_goal}
    #     - Barrier: {barrier}
    #     - Commitment: {commitment}/day
    #     - Target: {target_duration}

    #     STRICT TEST STRUCTURE (Total 21 Questions):
    #     - ID 1-10: Grammar (Focus on practical structures for "{comm_goal}")
    #     - ID 11-20: Vocabulary (Situational terms for "{comm_goal}" and "{barrier}")
    #     - ID 21: Speaking Prompts (Open-ended situational scenarios) about "{comm_goal}"

    #     JSON SCHEMA REQUIREMENTS:
    #     Return a single JSON object: {{"questions": [...]}}
    #     Each item MUST have:
    #     - "id": (int) strict sequence from 1 to 21.
    #     - "question_text": (string) in English.
    #     - "options": 
    #         * For MCQ (ID 1-20): Array of exactly 4 strings. NO prefixes like "A)", "B)", etc.
    #         * For Speaking (ID 21): Empty array [].
    #     - "correct_answer_key":
    #         * For MCQ: Exactly one character "A", "B", "C", or "D".
    #         * For Speaking: Exactly "N/A".
    #     - "question_type": "grammar", "vocabulary", or "speaking_prompt".

    #     OUTPUT CONSTRAINT:
    #     ⚠️ Return ONLY RAW JSON. No markdown blocks, no preamble, no conversational filler.
    #     ⚠️ Ensure logically plausible distractors for MCQs.
    #     """

    quiz_json_string = ""

    try:
        # gọi Gemini
        resp = await run_in_threadpool(
            client.models.generate_content,
            model= "gemini-2.5-flash-preview-09-2025",
            contents=[prompt],
            config=g_types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        quiz_json_string = resp.text.strip()

        # xử lý trường hợp có ```json
        if quiz_json_string.startswith("```"):
            quiz_json_string = (
                quiz_json_string.replace("```json", "").replace("```", "").strip()
            )

        raw = json.loads(quiz_json_string)

        if "questions" not in raw:
            raise ValueError("JSON thiếu thuộc tính 'questions'.")

        # Convert → Pydantic
        questions = [QuizQuestion(**q) for q in raw["questions"]]

        # VALIDATE RÀNG BUỘC QUY TẮC
        validate_quiz_questions(questions)

        return InitialQuizResponse(
            quiz_title="Bài kiểm tra chẩn đoán Giao tiếp",
            user_preferences=prefs,
            questions=questions
        )

    except Exception as e:
        print("❌ JSON lỗi:", quiz_json_string[:500])
        raise e
