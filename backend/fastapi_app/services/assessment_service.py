# backend/fastapi_app/services/assessment_service.py

from typing import Dict, List, Any
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
import re # Import thư viện regex

logger = logging.getLogger(__name__)

# Tận dụng client đã khởi tạo ở phạm vi global từ test_service
try:
    from .test_service import client, GEMINI_MODEL 
except ImportError:
    client = None
    GEMINI_MODEL = "gemini-2.0-flash"


# --- HÀM 1: STT VÀ PHÂN TÍCH TRANSCRIPT ---

async def run_stt_and_analysis_sync(audio_path: str, client):
    """Thực hiện Speech-to-Text (STT) và tính số từ."""
    def _sync_call():
        with open(audio_path, "rb") as f:
            audio_data = f.read()

        return client.models.generate_content(
            model="models/gemini-2.0-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"text": "Please transcribe this audio."},
                        {
                            "inline_data": {
                                "mime_type": "audio/mpeg", # Giả định mime_type phổ biến
                                "data": audio_data,
                            }
                        }
                    ]
                }
            ]
        )

    response = await run_in_threadpool(_sync_call)
    transcript = response.text
    word_count = len(transcript.split())  # tính số từ trong transcript

    return {
        "transcript": transcript,
        "word_count": word_count
    }
    
async def analyze_transcript_with_gemini(transcript: str, client: genai.Client) -> str:
    """Gọi Gemini để đánh giá ngữ pháp/từ vựng trong transcript của người dùng."""
    analysis_prompt = f"Phân tích văn bản: '{transcript}' về lỗi ngữ pháp, chất lượng từ vựng, và đưa ra 2 gợi ý cải thiện."
    try:
        analysis_response = await run_in_threadpool(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=[analysis_prompt]
        )
        return analysis_response.text.strip()
    except Exception as e:
        logger.error(f"Lỗi phân tích Transcript LLM: {e}")
        return "Lỗi phân tích. Vui lòng thử lại bài nói."


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

    # Tạo map từ file_key (dù frontend gửi gì) về tên file thực tế trong form
    file_key_to_form_key = {}
    for form_key in audio_files.keys():
        # form_key có thể là 'audio_file_21' hoặc 'audio_file_21[]' hoặc 'audio_21' tùy frontend
        logger.debug(f"Processing form_key for mapping: {form_key}")
        if isinstance(form_key, str):
            key = form_key
            # direct numeric extraction
            if key.startswith("audio_file_"):
                num = key.replace("audio_file_", "")
                file_key_to_form_key[num] = form_key
                try:
                    file_key_to_form_key[int(num)] = form_key
                except ValueError:
                    pass
            else:
                # try extract last numeric part
                m = re.search(r"(\d+)", key)
                if m:
                    num = m.group(1)
                    file_key_to_form_key[num] = form_key
                    try:
                        file_key_to_form_key[int(num)] = form_key
                    except ValueError:
                        pass
                # also map the raw key itself
                file_key_to_form_key[key] = form_key

    logger.info(f"[service] File key mapping (after scan): {file_key_to_form_key}")

    # Log speaking_data coming in payload for debug
    try:
        logger.info(f"[service] speaking_data payload: {payload_data.speaking_data}")
    except Exception:
        logger.exception("Không thể log speaking_data")

    for speaking_data_item in payload_data.speaking_data:
        raw_key = speaking_data_item.file_key
        logger.info(f"[service] Raw file_key từ frontend: {raw_key} (type: {type(raw_key)})")

        # Chuẩn hóa key: thử tất cả các khả năng
        possible_keys = []
        try:
            raw_key_str = str(raw_key).strip()
            possible_keys = [
                raw_key_str,
                raw_key_str.lstrip("Qq"),
                raw_key_str.replace("question_", ""),
                f"audio_file_{raw_key_str}",
                f"audio_{raw_key_str}",
            ]
        except Exception:
            possible_keys = [str(raw_key)]

        # Nếu raw_key là số dạng int/float
        if isinstance(raw_key, (int, float)):
            possible_keys.append(str(int(raw_key)))

        # Deduplicate
        seen = set()
        possible_keys = [k for k in possible_keys if not (k in seen or seen.add(k))]

        logger.debug(f"[service] possible_keys to try for raw_key {raw_key}: {possible_keys}")

        matched_form_key = None
        for k in possible_keys:
            # 1) direct in mapping dict
            if k in file_key_to_form_key:
                matched_form_key = file_key_to_form_key[k]
                logger.info(f"[service] matched via file_key_to_form_key: {k} -> {matched_form_key}")
                break
            # 2) direct form key present
            if k in audio_files:
                matched_form_key = k
                logger.info(f"[service] matched direct form key: {k}")
                break
            # 3) try with audio_file_ prefix
            prefix = f"audio_file_{k}"
            if prefix in audio_files:
                matched_form_key = prefix
                logger.info(f"[service] matched with prefix: {prefix}")
                break

        audio_file = audio_files.get(matched_form_key) if matched_form_key else None

        if not audio_file:
            logger.warning(f"Không tìm thấy audio cho file_key={raw_key} (đã thử: {possible_keys})")
            logger.warning(f"Các key có sẵn: {list(audio_files.keys())}")
            # fallback: nếu chỉ có 1 file, giả sử map vào đó (chỉ để debug, có thể loại bỏ sản xuất)
            if len(audio_files) == 1 and not full_speaking_analysis: # Chỉ dùng fallback nếu đây là file đầu tiên
                only_key = list(audio_files.keys())[0]
                logger.warning(f"[service] Fallback: chỉ có 1 file upload, dùng {only_key}")
                audio_file = audio_files.get(only_key)
            else:
                continue
        else:
            logger.info(f"ĐÃ TÌM THẤY audio cho Q{raw_key}: {matched_form_key} -> filename: {getattr(audio_file,'filename',None)}")

        # --- Kiểm tra nhanh nội dung file (size) trước khi ghi temp ---
        try:
            # Ở đây chỉ để log size approximate nếu có attribute .file
            file_obj = audio_file.file
            file_obj.seek(0, 2)
            size = file_obj.tell()
            file_obj.seek(0)
            logger.info(f"[service] File info - key: {matched_form_key}, filename: {getattr(audio_file,'filename',None)}, size_bytes: {size}")
        except Exception:
            logger.exception("Không thể lấy file size")

        # --- Từ đây giữ nguyên xử lý file ---
        tmp_path = None
        try:
            file_content = await audio_file.read()
            suffix = os.path.splitext(audio_file.filename)[1] or ".mp3"

            with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp_path = tmp.name
                await run_in_threadpool(tmp.write, file_content)

            logger.info(f"[service] Viết tạm file: {tmp_path}")

            # STT
            stt_result = await run_stt_and_analysis_sync(tmp_path, client)

            # Gemini Grammar
            llm_comment = await analyze_transcript_with_gemini(stt_result['transcript'], client)

            full_speaking_analysis.append({
                "question_id": raw_key,
                "transcript": stt_result['transcript'],
                "word_count": stt_result['word_count'],
                "latency_s": speaking_data_item.latency_ms / 1000,
                "llm_grammar_comment": llm_comment,
            })

        except Exception as e:
            logger.exception(f"Lỗi xử lý audio cho Q{raw_key}: {e}")

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
    if has_speaking and full_speaking_analysis[0]['latency_s'] > 1.5:
        weak_points_list.append("Phản xạ chậm (Latency > 1.5s)")

    speaking_transcript = full_speaking_analysis[0]['transcript'] if has_speaking else "Không có dữ liệu nói."

    # CẬP NHẬT PROMPT ĐỂ TẠO CẤU TRÚC JSON CHI TIẾT THEO YÊU CẦU
    roadmap_prompt = f"""
    Bạn là chuyên gia thiết kế lộ trình học tiếng Anh giao tiếp cá nhân hóa. 
    Bạn PHẢI trả về đúng và duy nhất một JSON hợp lệ, không có bất kỳ nội dung nào khác ngoài JSON.

    Thông tin người học:
    - Kết quả trắc nghiệm: {mcq_analysis}
    - Điểm yếu nổi bật: {", ".join(weak_points_list) if weak_points_list else "Chưa xác định rõ"}
    - Transcript nói mẫu: "{speaking_transcript}"
    - Cam kết học mỗi ngày: {prefs_dict['daily_commitment']}
    - Mục tiêu giao tiếp: {prefs_dict['communication_goal']}
    - Thời gian mong muốn đạt mục tiêu: {prefs_dict['target_duration']}

    Yêu cầu nghiêm ngặt:
    1. Phân tích kết quả MCQ ({mcq_analysis}), kỹ năng nói ({speaking_transcript}) và phản xạ (latency) để tự đánh giá trình độ hiện tại của người học (ví dụ: A1, A2, B1...).
    2. Viết nhận xét tổng quan (150-250 từ) bằng tiếng Việt cho key **"user_summary"**.
    3. Tạo lộ trình học chi tiết phù hợp với level của người học và cải thiện được điểm yếu của họ, chia thành 2-4 giai đoạn (phase).
    4. Mỗi giai đoạn PHẢI chứa mảng **"weeks"**.
    5. Trong mỗi tuần, các key **"grammar"**, **"vocabulary"**, **"speaking"** PHẢI có cấu trúc phức hợp bao gồm **"title"**, **"lesson_id"**, và mảng **"items"** chi tiết (ít nhất 2 items).

    TRẢ VỀ CHỈ MỘT JSON DUY NHẤT THEO ĐÚNG CẤU TRÚC SAU:

    {{
    "user_summary": "Nhận xét tổng quan bằng tiếng Việt (50-100 từ)...",
    "estimated_level": "Ví dụ: Pre-Intermediate (A2)",  <-- AI TỰ ĐIỀN VÀO ĐÂY
    "roadmap": {{
        "summary": "Tóm tắt ngắn gọn lộ trình trong 1-2 câu",
        "current_status": "Mục tiêu: {prefs_dict['communication_goal']} • Thời gian mong muốn: {prefs_dict['target_duration']}",
        "daily_plan_recommendation": "Khuyến nghị học {prefs_dict['daily_commitment']} mỗi ngày, tập trung nói + từ vựng",
        "learning_phases": [
        {{
            "phase_name": "Giai đoạn 1: Xây dựng nền tảng",
            "duration_weeks": 4,
            "weeks": [
            {{
                "week_number": 1,
                "grammar": {{
                    "title": "Present Simple & Present Continuous (review, cách dùng, cấu trúc)",
                    "lesson_id": "P1_W1_Grammar",
                    "items": [
                        {{"title": "Ngữ pháp Present Simple", "lesson_id": "P1_W1_G_Theory1"}},
                        {{"title": "Ngữ pháp Present Continuous", "lesson_id": "P1_W1_G_Theory2"}},
                    ]
                }},
                "vocabulary": {{
                    "title": "Daily routines, family, hobbies",
                    "lesson_id": "P1_W1_Vocab",
                    "items": [
                        {{"title": "Từ vựng về Daily routines (10 từ)", "lesson_id": "P1_W1_V_Theory1"}},
                        {{"title": "Từ vựng về Family (20)", "lesson_id": "P1_W1_V_Theory2"}},
                        {{"title": "hobbies (25)", "lesson_id": "P1_W1_V_Theory3"}},

                    ]
                }},
                "speaking": {{
                    "title": "Giới thiệu bản thân, nói về 1 ngày của bạn (1-2 phút)",
                    "lesson_id": "P1_W1_Speaking",
                    "items": [
                        {{"title": "Hội thoại chủ đề giới thiệu bản thân", "lesson_id": "P1_W1_S_conversation1"}},
			            {{"title": "Hội thoại chủ đề 1 ngày của bạn", "lesson_id": "P1_W1_S_conversation2"}},
                    ]
                }},
                "expected_outcome": "Nói trôi chảy câu cơ bản về bản thân và thói quen hàng ngày"
            }},
            {{
                "week_number": 2,
                "grammar": {{
                    "title": "Câu cầu khiến & Câu trần thuật",
                    "lesson_id": "P1_W2_Grammar",
                    "items": [
                        {{"title": "Câu cầu khiến", "lesson_id": "P1_W2_G_Theory1"}},
                        {{"title": "Câu trần thuật", "lesson_id": "P1_W2_G_Theory2"}},
                    ]
                }},
                "vocabulary": {{
                    "title": "Du lịch & Ẩm thực",
                    "lesson_id": "P1_W2_Vocab",
                    "items": [
                        {{"title": "Từ vựng về du lịch", "lesson_id": "P1_W2_V_Theory1"}},
                        {{"title": "Từ vựng về ẩm thực", "lesson_id": "P1_W2_V_Theory2"}}
                    ]
                }},
                "speaking": {{
                    "title": "Kể lại một trải nghiệm du lịch gần đây (2 phút)",
                    "lesson_id": "P1_W2_Speaking",
                    "items": [
                        {{"title": "Hội thoại kể lại một trải nghiệm du lịch gần đây", "lesson_id": "P1_W1_S_conversation1"}},
                    ]
                }},
                "expected_outcome": "Kể chuyện quá khứ có sử dụng mốc thời gian"
            }}
            ]
        }}
        ]
    }}
    }}

    QUAN TRỌNG:
    - Tổng số tuần của tất cả các giai đoạn phải hợp lý với thời gian mục tiêu ({prefs_dict['target_duration']}).
    - Tập trung khắc phục điểm yếu: {", ".join(weak_points_list) if weak_points_list else "cân bằng các kỹ năng"}.
    - Speaking task phải thực tế, có thể ghi âm và tự sửa.
    - Expected outcome phải đo lường được (thời lượng nói, số lỗi, độ trôi chảy...).

    Bắt đầu ngay bằng JSON, không viết gì thêm.
    """

    try:
        roadmap_response = await run_in_threadpool(
            client.models.generate_content,
            model=GEMINI_MODEL,
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


        final_roadmap = {
            "user_summary": user_summary, 
            "level": ai_assessed_level,
            "summary": raw_roadmap.get("summary", "Tóm tắt không có sẵn do lỗi LLM."),
            "current_status": raw_roadmap.get("current_status", f"Mục tiêu: {prefs_dict['communication_goal']}, Thời gian: {prefs_dict['target_duration']}"),
            "daily_plan_recommendation": raw_roadmap.get("daily_plan_recommendation", f"Khuyến nghị: Học {prefs_dict['daily_commitment']} mỗi ngày."),
            "learning_phases": final_learning_phases,
            "diagnostic_summary": mcq_analysis,
            "speaking_transcripts": full_speaking_analysis
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