# backend/fastapi_app/services/assessment_service.py

from typing import Dict, List, Any, Union
from tempfile import NamedTemporaryFile
from fastapi import UploadFile, HTTPException, Request
from fastapi_app.schemas.test_schemas import PreferenceData, FinalAssessmentSubmission, QuizQuestion 
import os
import json
import logging
from google import genai
from google.genai import types as g_types
from starlette.concurrency import run_in_threadpool
from google.genai.errors import APIError
import base64, mimetypes
from fastapi_app.database import admin_supabase
from fastapi_app.prompts.roadmap import build_roadmap_prompt, build_roadmap_adjustment_prompt
import anyio
import re # Import thư viện regex

logger = logging.getLogger(__name__)

# Tận dụng client đã khởi tạo ở phạm vi global từ test_service
try:
    from .test_service import client, GEMINI_MODEL 
except ImportError:
    client = None
    # GEMINI_MODEL = "gemini-2.0-flash"


# --- HÀM 1: STT VÀ PHÂN TÍCH TRANSCRIPT ---
    
# --- HÀM 2: CHẤM ĐIỂM TRẮC NGHIỆM THỰC TẾ ---

def calculate_mcq_score(
    mcq_answers: Dict[str, str] | None, 
    quiz_questions: List[QuizQuestion] 
) -> Dict[str, Any]: 
    """Hàm tính điểm trắc nghiệm (MCQ) bằng cách so sánh với câu trả lời LLM."""
    
    if mcq_answers is None:
        mcq_answers = {}
        
    total_answered = len(mcq_answers)
    correct_count = 0
    topic_results = {} 
    
    correct_data_map = {}
    for q in quiz_questions:
        if q.question_type != 'speaking_prompt':
            correct_data_map[str(q.id)] = {
                'correct_key': q.correct_answer_key, 
                'topic': q.question_type 
            }
            
    for q_id, user_key in mcq_answers.items():
        quiz_data = correct_data_map.get(q_id)
        
        if quiz_data:
            topic = quiz_data['topic']
            correct_answer = quiz_data['correct_key']
            
            if topic not in topic_results:
                topic_results[topic] = [0, 0]  # [correct, total]
            
            topic_results[topic][1] += 1
            
            if correct_answer == user_key:
                correct_count += 1
                topic_results[topic][0] += 1
            
    weak_topics = []
    WEAK_THRESHOLD = 0.60 
    
    for topic, (correct, total) in topic_results.items():
        if total > 0 and (correct / total) < WEAK_THRESHOLD:
            weak_topics.append(f"{topic} (Đúng: {correct}/{total})")

    if not weak_topics and total_answered > 0:
          weak_topics.append("Không phát hiện điểm yếu lớn ở phần trắc nghiệm.")

    score_percent = (correct_count / total_answered) * 100 if total_answered > 0 else 0
    
    return {
        "score_percent": score_percent,
        "correct_count": correct_count,
        "total_questions": total_answered,
        "weak_topics": weak_topics,
        # "estimated_level": "Intermediate (B1)" if score_percent >= 60 else "Pre-Intermediate (A2)",
    }

# -----------------------------------------------------------------
def initialize_user_progress(learning_phases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Quét qua toàn bộ learning_phases và khởi tạo trạng thái tiến độ ban đầu cho 
    tất cả các lesson_id tìm thấy.
    """
    user_progress = {}
    
    # 1. Lặp qua các Giai đoạn (Phases)
    for phase in learning_phases:
        for week in phase.get("weeks", []):
            
            # 2. Lặp qua các Kỹ năng (Grammar, Vocab, Speaking)
            for skill_type in ["grammar", "vocabulary", "speaking"]:
                skill_data = week.get(skill_type)
                
                if skill_data and skill_data.get("items"):
                    # 3. Lặp qua các Items (Bài học)
                    for item in skill_data["items"]:
                        lesson_id = item.get("lesson_id")
                        
                        if lesson_id and lesson_id not in user_progress:
                            # 4. Khởi tạo trạng thái ban đầu
                            user_progress[lesson_id] = {
                                "completed": False, 
                                "score": None,
                                "type": skill_type, # Lưu loại kỹ năng để dễ truy vấn sau này
                                "attempt_count": 0,
                                "status": "PENDING"
                            }
                            
    return user_progress
async def analyze_speaking_audio(audio_path: str, client):
    def _sync_call():
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        return client.models.generate_content(
            model="gemini-2.5-flash-preview-09-2025",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": """
                            You are an English speaking assessment engine.

                            Tasks:
                            1. Transcribe the audio.
                            2. Give a SHORT overall evaluation of speaking ability.
                            3. Identify MAIN speaking weaknesses based on grammar, vocabulary, pronunciation, or fluency.

                            Return ONLY valid JSON:
                            {
                            "transcript": "",
                            "speaking_overall": "",
                            "speaking_weakness": []
                            }

                            Rules:
                            - speaking_overall: 1–2 sentences
                            - speaking_weakness: list of short phrases (can be empty)
                            - No scores
                            - No word count
                            """
                        },
                        {
                            "inline_data": {
                                "mime_type": "audio/mpeg",
                                "data": audio_bytes
                            }
                        }
                    ]
                }
            ],
        )

    try:
        response = await run_in_threadpool(_sync_call)
        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()

        data = json.loads(raw_text)

        return {
            "transcript": data.get("transcript", ""),
            "speaking_overall": data.get(
                "speaking_overall",
                "Speaking ability could not be fully assessed."
            ),
            "speaking_weakness": data.get("speaking_weakness", []),
        }

    except Exception as e:
        logger.error(f"[Speaking Gemini Error] {e}")

        # 🔥 FALLBACK QUAN TRỌNG
        return {
            "transcript": "",
            "speaking_overall": "Speaking assessment is temporarily unavailable due to system limits."
        }
async def analyze_and_generate_roadmap(
    payload_data: FinalAssessmentSubmission,
    audio_files: Dict[str, UploadFile]
) -> Dict[str, Any]:
    if client is None:
        raise HTTPException(status_code=500, detail="Gemini Client không khả dụng.")

    # Chỉ log audio files
    logger.info(f"📌 FILE MAP NHẬN TỪ FRONTEND: {list(audio_files.keys())}")

    # --- 1. PHÂN TÍCH MCQ ---
    mcq_analysis = calculate_mcq_score(payload_data.mcq_answers, payload_data.quiz_questions)
    diagnostic_summary = mcq_analysis 
    
    # --- 2. XỬ LÝ SPEAKING ---
    full_speaking_analysis = []

    if audio_files and payload_data.speaking_data:
        for speaking_data_item in payload_data.speaking_data:
            raw_key = speaking_data_item.file_key

            # Fallback: chỉ lấy file đầu tiên nếu FE gửi 1 file
            audio_file = next(iter(audio_files.values()), None)

            if not audio_file:
                logger.warning(f"[Speaking] No audio found for Q{raw_key}")
                continue

            tmp_path = None
            try:
                file_bytes = await audio_file.read()
                suffix = os.path.splitext(audio_file.filename)[1] or ".mp3"

                with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    tmp_path = tmp.name
                    await run_in_threadpool(tmp.write, file_bytes)

                speaking_result = await analyze_speaking_audio(tmp_path, client)

                # Nếu không có lời nói → bỏ qua
                if not speaking_result.get("transcript") and speaking_result.get("status") == "FALLBACK":
                    logger.warning(f"[Speaking] Gemini unavailable for Q{raw_key} (quota or overload)")

                full_speaking_analysis.append({
                    "question_id": raw_key,
                    "transcript": speaking_result["transcript"],
                    "speaking_overall": speaking_result["speaking_overall"],
                    "latency_s": speaking_data_item.latency_ms / 1000,
                    "status": "OK",
                })

            except Exception as e:
                logger.warning(f"[Speaking] Failed Q{raw_key}: {e}")

            finally:
                if tmp_path and os.path.exists(tmp_path):
                    try:
                        os.unlink(tmp_path)
                    except:
                        pass

    
    # --- 3. XÂY DỰNG PROMPT CHO GEMINI và tạo roadmap ---
    prefs = payload_data.preferences
    prefs_dict = prefs.model_dump()

    weak_points_list = list(mcq_analysis.get('weak_topics', []))
    has_speaking = len(full_speaking_analysis) > 0

    speaking_overall = (
        full_speaking_analysis[0]["speaking_overall"]
        if has_speaking
        else "Không có đánh giá speaking."
    )

    for weakness in speaking_result.get("speaking_weakness", []):
        weak_points_list.append(f"Speaking: {weakness}")
    # CẬP NHẬT PROMPT ĐỂ TẠO CẤU TRÚC JSON CHI TIẾT THEO YÊU CẦU
    roadmap_prompt = build_roadmap_prompt(
        mcq_analysis=mcq_analysis,
        weak_points_list=weak_points_list,
        speaking_overall=speaking_overall,
        prefs_dict=prefs_dict,
    )

    try:
        roadmap_response = await run_in_threadpool(
            client.models.generate_content,
            model="gemini-2.5-flash-preview-09-2025",
            contents=[roadmap_prompt],
            config=g_types.GenerateContentConfig(response_mime_type="application/json")
        )

        roadmap_json = json.loads(roadmap_response.text)
        ai_assessed_level = roadmap_json.get("estimated_level", "Unknown")
        user_summary = roadmap_json.get("user_summary", "Không có tóm tắt.")
        raw_roadmap = roadmap_json.get("roadmap", {})

        # CẬP NHẬT LOGIC XỬ LÝ: TRÍCH XUẤT TRỰC TIẾP CẤU TRÚC TUẦN
        final_learning_phases = []
        for idx, phase in enumerate(raw_roadmap.get("learning_phases", [])):
            phase_name = phase.get("phase_name") or f"Giai đoạn {idx + 1}"
            duration_weeks = phase.get("duration_weeks", 0)
            weeks = phase.get("weeks", [])

            # Đảm bảo cấu trúc tuần được giữ nguyên, sử dụng Dict cho grammar/vocab/speaking
            standardized_weeks = []
            for week in weeks:
                standardized_weeks.append({
                    "week_number": week.get("week_number"),
                    "grammar": week.get("grammar", {}), # Lấy dưới dạng Dict, mặc định là {}
                    "vocabulary": week.get("vocabulary", {}), # Lấy dưới dạng Dict, mặc định là {}
                    "speaking": week.get("speaking", {}), # Lấy dưới dạng Dict, mặc định là {}
                    "expected_outcome": week.get("expected_outcome", "")
                })

            final_learning_phases.append({
                "phase_name": phase_name,
                "duration_weeks": duration_weeks,
                "weeks": standardized_weeks,
            })
        # Chuẩn bị roadmap cuối cùng để lưu
        initial_progress = initialize_user_progress(final_learning_phases)

        final_roadmap = {
            "user_summary": user_summary, 
            "level": ai_assessed_level,
            "summary": raw_roadmap.get("summary", "Tóm tắt không có sẵn do lỗi LLM."),
            "current_status": raw_roadmap.get("current_status", f"Mục tiêu: {prefs_dict['communication_goal']}, Thời gian: {prefs_dict['target_duration']}"),
            "daily_plan_recommendation": raw_roadmap.get("daily_plan_recommendation", f"Khuyến nghị: Học {prefs_dict['daily_commitment']} mỗi ngày."),
            "learning_phases": final_learning_phases,
            "diagnostic_summary": mcq_analysis,
            "speaking_transcripts": full_speaking_analysis,
            "user_progress": initial_progress,  
        }
        
        # --- 4. LƯU ROADMAP VÀO admin_supabase ---
        try:
            # 1. Thực hiện xoá tất cả roadmap hiện có của user này
            # Lệnh delete sẽ xoá tất cả dòng khớp với user_id
            admin_supabase.table("roadmaps") \
                .delete() \
                .eq("user_id", payload_data.user_id) \
                .execute()
            
            logger.info(f"🗑️ Đã xoá lộ trình cũ của user {payload_data.user_id}")

            # 2. Chuẩn bị dữ liệu mới hoàn toàn
            insert_data = {
                "user_id": payload_data.user_id,
                "level": ai_assessed_level,
                "data": final_roadmap,
            }

            # 3. Chèn (Insert) bản ghi mới nhất vào bảng
            result = admin_supabase.table("roadmaps") \
                .insert(insert_data) \
                .execute()
            
            logger.info(f"✨ Đã lưu lộ trình mới thành công cho user {payload_data.user_id}")

        except Exception as e:
            # Ghi log chi tiết lỗi nếu thao tác database thất bại
            logger.error(f"❌ Lỗi khi làm mới roadmap trong admin_supabase: {e}")
            
        return {
            "status": "success",
            "message": "Roadmap created",
            "roadmap_details": {
                "roadmap": final_roadmap,
                "diagnostic_summary": mcq_analysis
            },
            "diagnostic_summary": mcq_analysis,
            "speaking_transcripts": full_speaking_analysis
        }

    except json.JSONDecodeError as e:
        # Log đầy đủ response text nếu có thể để debug lỗi JSON
        if 'roadmap_response' in locals():
             logger.error(f"JSON response text failed to decode: {roadmap_response.text}")
        logger.error(f"JSON từ Gemini không hợp lệ: {e}")
        raise HTTPException(status_code=500, detail="Lỗi định dạng JSON từ AI")
    except Exception as e:
        logger.error(f"Lỗi tạo Roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi tạo lộ trình: {str(e)}")
    
# --- HÀM 3: TRUY XUẤT ROADMAP (FIXED) ---

def get_user_roadmap(user_id: str):
    """Truy xuất roadmap gần nhất của người dùng từ admin_supabase."""
    try:
        res = (
            admin_supabase.table("roadmaps")
            .select("id, level, data, created_at")   # ← CHỈ SELECT CÁC CỘT CỤ THỂ (không dùng *)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )

        # Nếu không có bản ghi => trả về None
        if not getattr(res, "data", None):
            logger.info(f"[get_user_roadmap] No roadmap found for user_id={user_id}")
            return None

        return res.data

    except Exception as e:
        logger.exception(f"[get_user_roadmap] Lỗi truy xuất roadmap: {e}")
        return None
    
def check_week_completion(current_progress: Dict[str, Any], completed_week_data: Dict[str, Any]) -> bool:
    """
    Kiểm tra xem tất cả các Task trong tuần đã hoàn thành (SUCCESS) 
    hay đã hết lượt thử (END_OF_ATTEMPTS) hay chưa.
    """
    
    # Lấy danh sách Lesson ID của tuần đó
    all_lesson_ids_in_week = []
    
    for section in ['grammar', 'vocabulary', 'speaking']:
        items = completed_week_data.get(section, {}).get('items', [])
        
        # 🚨 SỬA LỖI: Dùng .get() và lọc các Task không có ID để tránh KeyError
        for item in items:
            lesson_id = item.get('lesson_id')
            if lesson_id is None:
                logger.warning(f"⚠️ Task bị thiếu 'lesson_id' trong tuần {completed_week_data.get('week_number')}: {item}")
                continue # Bỏ qua item này và tiếp tục

            all_lesson_ids_in_week.append(lesson_id)
        
    if not all_lesson_ids_in_week:
        return False # Tuần không có Task nào

    for lesson_id in all_lesson_ids_in_week:
        progress = current_progress.get(lesson_id)
        
        # Nếu Task chưa được thực hiện lần nào (None) hoặc có trạng thái PENDING
        if progress is None or progress.get('status') == 'PENDING':
            # Nếu có bất kỳ Task nào còn PENDING, tuần học CHƯA kết thúc
            return False 

    # Nếu tất cả các Task đều là SUCCESS hoặc END_OF_ATTEMPTS
    return True

def get_week_data_by_lesson_id(lesson_id: str, roadmap_data: Dict[str, Any]) -> Dict[str, Any] | None:
    """
    Duyệt qua Roadmap để tìm bản ghi của Tuần chứa lesson_id này.
    """
    for phase in roadmap_data.get('learning_phases', []):
        for week in phase.get('weeks', []):
            for section in ['grammar', 'vocabulary', 'speaking']:
                items = week.get(section, {}).get('items', [])
                # Kiểm tra nếu bất kỳ item nào có lesson_id khớp
                if any(item.get('lesson_id') == lesson_id for item in items):
                    return week
    return None
# def get_week_data_by_lesson_id(lesson_id: str, roadmap_data: Dict[str, Any]) -> Dict[str, Any] | None:
#     """Duyệt qua Roadmap để tìm bản ghi của Tuần chứa lesson_id này."""
#     for phase in roadmap_data.get('learning_phases', []):
#         for week in phase.get('weeks', []):
#             for section in ['grammar', 'vocabulary', 'speaking']:
#                 items = week.get(section, {}).get('items', [])
#                 if any(item.get('lesson_id') == lesson_id for item in items):
#                     return week
#     return None

async def create_weekly_summary_record(
    user_id: str,
    completed_week_data: Dict[str, Any],
    current_progress: Dict[str, Any],
    admin_supabase
) -> Union[Dict, bool]:

    try:
        week_number = completed_week_data["week_number"]
        first_item = next(
            iter(completed_week_data.get("grammar", {}).get("items", [])),
            None
        )
        phase = first_item["lesson_id"].split("_")[0] if first_item else "P0"

    except Exception as e:
        logger.error(f"❌ Invalid completed_week_data structure: {e}")
        return False

    def _aggregate_and_insert_sync():

        summaries = {}
        total_tasks = 0
        resolved_tasks = 0
        review_required = False

        for skill in ["grammar", "vocabulary", "speaking"]:
            items = completed_week_data.get(skill, {}).get("items", [])
            scores = []
            review_topics = []
            completed = 0

            for item in items:
                lesson_id = item["lesson_id"]
                topic = item.get("title", "Unknown")
                progress = current_progress.get(lesson_id, {})

                status = progress.get("status")
                score = progress.get("score", 0)

                total_tasks += 1

                if status in ("SUCCESS", "END_OF_ATTEMPTS"):
                    resolved_tasks += 1

                if status == "SUCCESS":
                    completed += 1
                    scores.append(score)

                elif status == "END_OF_ATTEMPTS":
                    review_topics.append(topic)
                    scores.append(score)
                    review_required = True

            avg_score = round(sum(scores) / len(scores), 2) if scores else 0

            summaries[f"{skill}_summary"] = {
                "completed_tasks": completed,
                "review_tasks": review_topics,
                "avg_score": avg_score if skill != "vocabulary" else None,
                "avg_mastery": avg_score if skill == "vocabulary" else None
            }

        completion_rate = round(
            resolved_tasks / total_tasks, 4
        ) if total_tasks > 0 else 0

        insert_data = {
            "user_id": user_id,
            "phase": phase,
            "week_number": week_number,
            "speaking_summary": summaries["speaking_summary"],
            "grammar_summary": summaries["grammar_summary"],
            "vocabulary_summary": summaries["vocabulary_summary"],
            "completion_rate": completion_rate,
            "review_required": review_required
        }

        result = (
            admin_supabase
            .table("weekly_learning_summary")
            .insert(insert_data)
            .execute()
        )

        return result.data[0] if result.data else False

    try:
        record = await anyio.to_thread.run_sync(_aggregate_and_insert_sync)
        logger.info(f"✅ Weekly Summary P{phase}_W{week_number} inserted")
        return record

    except Exception as e:
        logger.error(f"❌ Failed to insert weekly summary: {e}")
        return False
    
logger = logging.getLogger(__name__)

# --- HÀM MỚI: ĐIỀU CHỈNH ROADMAP BẰNG AI ---

async def generate_and_apply_adaptive_roadmap(
    user_id: str,
    weekly_summary_record: Dict[str, Any], # Bản ghi tóm tắt tuần N
    current_roadmap_data: Dict[str, Any], # Toàn bộ Roadmap
    admin_supabase
) -> bool:
    """
    Sử dụng AI để phân tích kết quả tuần trước (N) và điều chỉnh nội dung tuần sau (N+1).
    """
    phase_index = -1
    last_week_index = -1
    next_phase_index = -1
    # 1. XÁC ĐỊNH TUẦN VỪA KẾT THÚC VÀ TUẦN TIẾP THEO
    try:
        last_week_number = weekly_summary_record.get('week_number')
        
        # Lấy nhãn Phase ngắn gọn từ Summary (Ví dụ: 'P1')
        raw_phase_label = weekly_summary_record.get('phase') 
        
        if not raw_phase_label:
            logger.error("Phase label 'phase' not found in summary record.")
            return False

        # 🚨 SỬA LỖI #1: CHUẨN HÓA Phase Label ('P1' -> 'Phase 1')
        # Logic: Tìm kiếm P (hoặc bất kỳ chữ cái nào) theo sau là số
        match = re.match(r'[A-Z](\d+)', raw_phase_label, re.IGNORECASE)
        if match:
             # Tạo chuỗi tìm kiếm hoàn hảo: Ví dụ: P1 -> Phase 1
             search_phase_label = f"Phase {match.group(1)}"
        else:
             # Fallback nếu định dạng không phải Px
             search_phase_label = raw_phase_label
        
        # --- DEBUG KHÓA TÌM KIẾM ---
        logger.debug(f"DEBUG: Searching for Phase Label: {search_phase_label}") 
        logger.debug(f"DEBUG: Target Week Number: {last_week_number}")
        # ----------------------------

        # 🚨 SỬA LỖI #2: Tìm kiếm Phase index. Dùng `in` để tìm 'Phase 1' 
        # bên trong chuỗi dài "Phase 1: Building Active Foundations".
        phase_index_completed = next( # Đổi tên biến để giữ index của Phase vừa hoàn thành
            i for i, p in enumerate(current_roadmap_data['learning_phases']) 
            if p.get('phase_name') and search_phase_label in p['phase_name']
        )
        
        # Tìm index của tuần vừa kết thúc
        last_week_index = next(
            i for i, w in enumerate(current_roadmap_data['learning_phases'][phase_index_completed]['weeks']) 
            if w.get('week_number') == last_week_number
        )

        next_phase_index = phase_index_completed # Index Phase cho tuần mới (mặc định là Phase cũ)
        
        # 1a. Tìm dữ liệu Tuần Mới (N+1)
        if last_week_index + 1 < len(current_roadmap_data['learning_phases'][phase_index_completed]['weeks']):
            # Tuần tiếp theo trong cùng Phase
            next_week_index = last_week_index + 1
            # Sử dụng phase_index_completed để tham chiếu Phase hiện tại
            next_week_data_ref = current_roadmap_data['learning_phases'][phase_index_completed]['weeks'][next_week_index]
        
        elif phase_index_completed + 1 < len(current_roadmap_data['learning_phases']):
            # Tuần đầu tiên của Phase tiếp theo
            next_phase_index = phase_index_completed + 1 # Cập nhật chỉ mục Phase tiếp theo
            next_week_index = 0
            # Sử dụng next_phase_index đã cập nhật
            next_week_data_ref = current_roadmap_data['learning_phases'][next_phase_index]['weeks'][next_week_index] 
        else:
            logger.info(f"💡 [ROADMAP] Người dùng đã hoàn thành toàn bộ Roadmap.")
            return True
        next_week_data_base = next_week_data_ref.copy() # Dữ liệu tuần N+1 gốc

    except (StopIteration, IndexError) as e:
        logger.error(f"❌ Lỗi tìm kiếm Phase/Week trong Roadmap: {e}")
        return False
    next_phase_name = current_roadmap_data['learning_phases'][next_phase_index]['phase_name']

# Trích xuất số Phase từ tên (Ví dụ: '2' từ 'Phase 2')
    match = re.search(r'Phase (\d+)', next_phase_name)
    if match:
        # Tạo nhãn Phase động (Ví dụ: 'P2')
        dynamic_phase_label = f"P{match.group(1)}" 
    else:
        dynamic_phase_label = "Px"
        # 2. XÂY DỰNG PROMPT CHO AI ĐIỀU CHỈNH
    
    # Chuyển dữ liệu tuần N+1 gốc sang JSON string để truyền vào Prompt
    next_week_json = json.dumps(next_week_data_base, indent=2, ensure_ascii=False)
    logger.debug(f"Next week JSON (before adjustment): {next_week_json}")
    prompt = build_roadmap_adjustment_prompt(
        last_week_number=last_week_number,
        weekly_summary_record=json.dumps(weekly_summary_record, indent=2, ensure_ascii=False), # Cần đảm bảo đây là chuỗi JSON
        next_week_data_base=next_week_data_base,
        next_week_json=json.dumps(next_week_data_base, indent=2, ensure_ascii=False), # Cần đảm bảo đây là chuỗi JSON
        dynamic_phase_label=dynamic_phase_label
    )
    # prompt = f"""
    # You are a Personalized Learning Roadmap Adjustment System. Your task is to thoroughly analyze the learning results from the previous week in order to adjust the learning content for the following week.

    # 1. PREVIOUS WEEK ASSESSMENT DATA (Week {last_week_number}):
    # {json.dumps(weekly_summary_record, indent=2, ensure_ascii=False)}

    # 2. NEXT WEEK ROADMAP STRUCTURE (Week {next_week_data_base.get('week_number')} – ORIGINAL JSON FORMAT):
    # {next_week_json}

    # YOUR ADJUSTMENT RULES:
    #     - If there are any Tasks in the 'review_tasks' list of Grammar, Vocabulary, or Speaking, **insert** these Tasks at the **beginning** of the 'items' list of the corresponding topic in the next week’s structure.

    #     - FOR NEW REVIEW TASKS:
    #         - Must include the key **"type": "review"**.
    #         - The "title" key must have the prefix **"REVIEW: "**.
    #         - **MUST** include the **"lesson_id"** key with a unique format, in which the 5th character represents the corresponding skill symbol (G, V, or S). For example:
    #             * Grammar Review: **{dynamic_phase_label}_W{next_week_data_base.get('week_number')}_G_Review1**
    #             * Vocabulary Review: **{dynamic_phase_label}_W{next_week_data_base.get('week_number')}_V_Review1**
    #             * Speaking Review: **{dynamic_phase_label}_W{next_week_data_base.get('week_number')}_S_Review1**

    #     - If the average score of a skill (avg_score or avg_mastery) is too low (below 0.6), you may **remove** 1 or 2 new theory/vocabulary Tasks in Week N+1 to reduce workload.
    #     - DO NOT change 'week_number' and 'phase' under any circumstances.
    #     - DO NOT add any explanatory text; return **ONLY the JSON OBJECT** of the **ADJUSTED NEXT WEEK ROADMAP STRUCTURE** (including week_number, grammar, vocabulary, speaking, etc.).

    # Please return the adjusted JSON of the NEXT WEEK ROADMAP STRUCTURE in English.
    # """
    # 3. GỌI GEMINI VÀ XỬ LÝ KẾT QUẢ
    client = genai.Client()
    try:
        def _call_gemini_sync():
            return client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=g_types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )

        response = await anyio.to_thread.run_sync(_call_gemini_sync)

        modified_next_week_data = json.loads(response.text)
        logger.info(f"✅ AI đã hoàn tất điều chỉnh cho Tuần {modified_next_week_data.get('week_number')}.")
        
    except (APIError, json.JSONDecodeError) as e:
        logger.error(f"❌ Lỗi AI hoặc JSON khi điều chỉnh Roadmap: {e}. Sẽ sử dụng cấu trúc Roadmap gốc.")
        modified_next_week_data = next_week_data_base # Dùng cấu trúc gốc nếu AI thất bại
    except Exception as e:
        logger.error(f"❌ Lỗi không xác định trong quá trình gọi AI: {e}")
        modified_next_week_data = next_week_data_base 


    # 4. CẬP NHẬT ROADMAP CUỐI CÙNG (Thay thế tuần cũ và chèn tuần mới đã chỉnh sửa)
    
    # 4a. Đánh dấu tuần N là COMPLETED
    # current_roadmap_data['learning_phases'][phase_index]['weeks'][last_week_index]['status'] = 'COMPLETED'
    def get_all_valid_lesson_ids(roadmap_data: Dict[str, Any]) -> set:
        """Thu thập tất cả lesson_id đang tồn tại trong Roadmap."""
        valid_ids = set()
        for phase in roadmap_data.get('learning_phases', []):
            for week in phase.get('weeks', []):
                for section in ['grammar', 'vocabulary', 'speaking']:
                    items = week.get(section, {}).get('items', [])
                    for item in items:
                        # Dùng .get() để tránh crash và lấy ID hợp lệ
                        lesson_id = item.get('lesson_id')
                        if lesson_id:
                            valid_ids.add(lesson_id)
        return valid_ids

    def cleanup_user_progress(roadmap_data: Dict[str, Any], user_progress: Dict[str, Any]) -> Dict[str, Any]:
        """Loại bỏ các Task đã bị xóa khỏi Roadmap khỏi user_progress."""
        valid_ids = get_all_valid_lesson_ids(roadmap_data)
        
        # Chỉ giữ lại các mục trong user_progress có ID nằm trong valid_ids
        cleaned_progress = {
            lesson_id: progress_data 
            for lesson_id, progress_data in user_progress.items() 
            if lesson_id in valid_ids
        }
        
        # Ghi log các Task bị xóa (tùy chọn)
        removed_tasks = set(user_progress.keys()) - set(cleaned_progress.keys())
        if removed_tasks:
            logger.info(f"🗑️ Đã dọn dẹp {len(removed_tasks)} Task khỏi user_progress: {removed_tasks}")

        return cleaned_progress
    # 4b. Thay thế tuần N+1 gốc bằng cấu trúc đã được AI điều chỉnh
    current_roadmap_data['learning_phases'][next_phase_index]['weeks'][next_week_index] = modified_next_week_data
    def sync_new_tasks(roadmap_data, user_progress):
        # Lấy dữ liệu tuần mới đã được AI chỉnh sửa
        new_week = roadmap_data['learning_phases'][next_phase_index]['weeks'][next_week_index]
        
        for category in ['grammar', 'speaking', 'vocabulary']:
            if category in new_week:
                # Kiểm tra xem khóa 'items' có tồn tại không
                items = new_week[category].get('items', []) 
                
                for item in items:
                    # 🚨 SỬA LỖI: Dùng .get() để tránh KeyError nếu AI trả về cấu trúc thiếu
                    lesson_id = item.get('lesson_id') 
                    
                    if lesson_id and lesson_id not in user_progress:
                        # Thêm Task mới (bao gồm cả Task Review) vào user_progress với trạng thái PENDING
                        user_progress[lesson_id] = {
                            "type": category,
                            "score": None,
                            "status": "PENDING",
                            "completed": False,
                            "attempt_count": 0
                        }
        return user_progress

    # Thực hiện đồng bộ hóa
    current_roadmap_data['user_progress'] = cleanup_user_progress(
        current_roadmap_data, 
        current_roadmap_data['user_progress']
            )
    current_roadmap_data['user_progress'] = sync_new_tasks(current_roadmap_data, current_roadmap_data['user_progress'])
    
    # 5. LƯU ROADMAP ĐÃ CẬP NHẬT VÀO DB
    def _save_roadmap_sync():
        result = admin_supabase.table("roadmaps") \
            .update({"data": current_roadmap_data}) \
            .eq("user_id", user_id) \
            .execute()
        return result.data

    try:
        await anyio.to_thread.run_sync(_save_roadmap_sync)
        logger.info("✅ Roadmap đã được lưu thành công với điều chỉnh từ AI.")
        return True
    except Exception as e:
        logger.error(f"❌ Lỗi lưu Roadmap sau khi điều chỉnh AI: {e}")
        return False