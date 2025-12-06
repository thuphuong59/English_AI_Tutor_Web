
from ..schemas.test_schemas import PreferenceData, InitialQuizResponse, QuizQuestion
import json
from typing import List
from google import genai
from google.genai import types as g_types
from google.genai.errors import APIError 
from starlette.concurrency import run_in_threadpool
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_CHAT_MODEL", "gemini-2.5-flash")

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except:
    client = None


# ================================================================
#  VALIDATOR CỰC MẠNH — RÀNG BUỘC CHẶT CHẼ ĐẦU RA CỦA GEMINI
# ================================================================
def validate_quiz_questions(questions: List[QuizQuestion]):
    allowed_types = {"grammar", "vocabulary", "speaking_prompt"}

    if len(questions) != 23:
        raise ValueError(f"Quiz phải có đúng 23 câu hỏi, nhận được {len(questions)}")

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

    prompt = f"""
    Bạn là chuyên gia thiết kế bài kiểm tra chẩn đoán tiếng Anh giao tiếp.

    Hãy tạo một JSON object duy nhất chứa thuộc tính "questions".

    ⚠️ CHỈ TRẢ RA JSON — KHÔNG TRẢ LỜI THÊM KÝ TỰ NÀO KHÁC.

    Quiz gồm đúng 23 câu:
    - 10 grammar
    - 10 vocabulary
    - 3 speaking_prompt

    Mỗi item trong mảng questions phải có:
    - id (int 1 → 23)
    - question_text (string)
    - options: 
        • 4 string, không chứa A), B), C), D), nếu là grammar/vocabulary
        • [] nếu là speaking_prompt
    - correct_answer_key:
        • A/B/C/D nếu là trắc nghiệm
        • "N/A" nếu là speaking_prompt
    - question_type: "grammar" | "vocabulary" | "speaking_prompt"
    """

    quiz_json_string = ""

    try:
        # gọi Gemini
        resp = await run_in_threadpool(
            client.models.generate_content,
            model=GEMINI_MODEL,
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
