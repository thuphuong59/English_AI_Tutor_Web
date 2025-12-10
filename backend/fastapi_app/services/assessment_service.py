from typing import Dict, List, Any
from tempfile import NamedTemporaryFile
from fastapi import UploadFile, HTTPException, Request
from fastapi_app.schemas.test_schemas import PreferenceData, FinalAssessmentSubmission, QuizQuestion 
import os
import json
import logging
import google.generativeai as genai
from google.genai import types as g_types
from starlette.concurrency import run_in_threadpool
import base64, mimetypes
from fastapi_app.database import admin_supabase # Dùng db_client từ database.py


logger = logging.getLogger(__name__)

# Tận dụng client đã khởi tạo ở phạm vi global từ test_service
try:
    from .test_service import client, GEMINI_MODEL 
except ImportError:
    client = None
    GEMINI_MODEL = "gemini-2.0-flash"


# --- HÀM 1: STT VÀ PHÂN TÍCH TRANSCRIPT (Giữ nguyên) ---

async def run_stt_and_analysis_sync(audio_path: str, client):
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
                                "mime_type": "audio/mpeg",
                                "data": base64.b64encode(audio_data).decode("utf-8"), # Sửa base64 encoding
                            }
                        }
                    ]
                }
            ]
        )

    response = await run_in_threadpool(_sync_call)
    transcript = response.text
    word_count = len(transcript.split()) 

    return {
        "transcript": transcript,
        "word_count": word_count
    }
async def analyze_transcript_with_gemini(transcript: str) -> str:
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
                topic_results[topic] = [0, 0] 
            
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
        "estimated_level": "Intermediate (B1)" if score_percent >= 60 else "Pre-Intermediate (A2)",
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
                file_key_to_form_key[int(num)] = form_key
            else:
                # try extract last numeric part
                import re
                m = re.search(r"(\d+)", key)
                if m:
                    num = m.group(1)
                    file_key_to_form_key[num] = form_key
                    file_key_to_form_key[int(num)] = form_key
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
            possible_keys = [
                str(raw_key).strip(),
                str(raw_key).strip().lstrip("Qq"),
                str(raw_key).strip().replace("question_", ""),
                f"audio_file_{str(raw_key).strip()}",
                f"audio_{str(raw_key).strip()}",
            ]
        except Exception:
            possible_keys = [str(raw_key)]

        # Nếu raw_key là số dạng int
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
            if len(audio_files) == 1:
                only_key = list(audio_files.keys())[0]
                logger.warning(f"[service] Fallback: chỉ có 1 file upload, dùng {only_key}")
                audio_file = audio_files.get(only_key)
            else:
                continue
        else:
            logger.info(f"ĐÃ TÌM THẤY audio cho Q{raw_key}: {matched_form_key} -> filename: {getattr(audio_file,'filename',None)}")

        # --- Kiểm tra nhanh nội dung file (size) trước khi ghi temp ---
        try:
            # Không đọc toàn bộ nếu lớn — nhưng UploadFile hỗ trợ .file.tell() nếu cần
            # Ở đây chỉ để log size approximate nếu có attribute .file
            try:
                file_obj = audio_file.file
                file_obj.seek(0, 2)
                size = file_obj.tell()
                file_obj.seek(0)
            except Exception:
                size = None
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

    roadmap_prompt = f"""
    Bạn là chuyên gia thiết kế lộ trình học tiếng Anh giao tiếp.

    Trước tiên, hãy **nhận xét tổng quan về người học dựa trên các thông tin sau**:
    - Kết quả bài test: {mcq_analysis}
    - Điểm yếu hiện tại: {", ".join(weak_points_list)}
    - Transcript nói mẫu: {speaking_transcript}
    - Cam kết học mỗi ngày: {prefs_dict['daily_commitment']}
    - Mục tiêu: {prefs_dict['communication_goal']}
    - Thời gian mong muốn: {prefs_dict['target_duration']}

    Nhận xét cần nêu rõ:
    - Trình độ hiện tại của người học
    - Điểm mạnh / điểm yếu nổi bật
    - Khả năng hoàn thành mục tiêu dựa trên thời gian cam kết
    - Khuyến nghị tổng quan trước khi đi vào lộ trình

    Sau đó, dựa vào các thông tin trên, hãy tạo **lộ trình học cá nhân hóa**:
    - Số giai đoạn: linh hoạt, tùy thuộc vào kết quả test và thời gian mong muốn của người học
    - Mỗi giai đoạn gồm: tên giai đoạn, thời lượng, trọng tâm học, daily plan, expected outcomes, milestone
    - Nội dung lộ trình phù hợp với thời gian cam kết hàng ngày, mục tiêu và điểm yếu của người học
    - Đảm bảo lộ trình vừa thực tế vừa hiệu quả, tránh quá tải

    TRẢ VỀ **CHỈ MỘT JSON DUY NHẤT** với cấu trúc:

    {{
    "user_summary": "Nhận xét tổng quan về người học dựa trên kết quả test và thông tin cung cấp",
    "roadmap": {{
        "summary": "Tóm tắt ngắn gọn lộ trình 1-2 câu",
        "current_status": "Mục tiêu: {prefs_dict['communication_goal']}, Thời gian: {prefs_dict['target_duration']}",
        "daily_plan_recommendation": "Khuyến nghị học {prefs_dict['daily_commitment']} mỗi ngày",
        "learning_phases": [
            {{
                "phase_name": "Giai đoạn 1: Xây dựng nền tảng",
                "duration": "Tuần 1-2",
                "focus_points": ["Ngữ pháp cơ bản", "Từ vựng hàng ngày", "Phát âm"],
                "daily_activities": [
                    {{"time_estimate": "20 phút", "activity": "Học từ vựng mới theo chủ đề"}},
                    {{"time_estimate": "25 phút", "activity": "Luyện cấu trúc câu cơ bản"}},
                    {{"time_estimate": "15 phút", "activity": "Nghe và nhắc lại câu mẫu"}}
                ],
                "expected_outcomes": "Nắm vững từ vựng cơ bản và nói được câu đơn hoàn chỉnh",
                "milestone": {{
                    "milestone_name": "Hoàn thành giai đoạn nền tảng",
                    "target_score_goal": "80% bài kiểm tra nhỏ",
                    "milestone_requirements": [
                        "Hoàn thành 90% bài tập hàng ngày",
                        "Nói trôi chảy 10 câu giới thiệu bản thân"
                    ]
                }}
            }}
        ]
    }}
    }}
    """

    try:
        roadmap_response = await run_in_threadpool(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=[roadmap_prompt],
            config=g_types.GenerateContentConfig(response_mime_type="application/json")
        )

        roadmap_json = json.loads(roadmap_response.text)
        raw_roadmap = roadmap_json.get("roadmap", {})

        # CHỖ QUAN TRỌNG NHẤT – ĐÃ SỬA ĐÚNG TÊN KEY CHO FRONTEND
        final_learning_phases = []
        for idx, phase in enumerate(raw_roadmap.get("learning_phases", [])):
            final_learning_phases.append({
                "phase_name": phase.get("phase_name") or phase.get("stage_name") or f"Giai đoạn {idx + 1}",
                "duration": phase.get("duration", "1-2 tuần"),
                "focus_points": phase.get("focus_points", []),
                "daily_activities": phase.get("daily_activities", []),
                "expected_outcomes": phase.get("expected_outcomes", "Cải thiện kỹ năng cơ bản"),
                "milestone": phase.get("milestone", {
                    "milestone_name": "Hoàn thành giai đoạn",
                    "target_score_goal": "80% kiểm tra",
                    "milestone_requirements": ["Hoàn thành 90% bài tập"]
                })
            })

        final_roadmap = {
            "summary": raw_roadmap.get("summary", "Tóm tắt không có sẵn do lỗi LLM."),
            "current_status": raw_roadmap.get("current_status", f"Mục tiêu: {prefs_dict['communication_goal']}, Thời gian: {prefs_dict['target_duration']}"),
            "daily_plan_recommendation": raw_roadmap.get("daily_plan_recommendation", f"Khuyến nghị: Học {prefs_dict['daily_commitment']} mỗi ngày."),
            "learning_phases": final_learning_phases,
            "diagnostic_summary": mcq_analysis,
            "speaking_transcripts": full_speaking_analysis
        }
        # --- 4. LƯU ROADMAP VÀO SUPABASE ---
        try:
            # --- 4A. Check user đã có roadmap chưa ---
            existing = (
                admin_supabase.table("roadmaps")
                .select("*")
                .eq("user_id", payload_data.user_id)
                .maybe_single()
                .execute()
            )

            insert_data = {
                "user_id": payload_data.user_id,
                "level": mcq_analysis.get("estimated_level", "unknown"),
                "data": final_roadmap,
            }

            # --- 4B. Nếu đã có → UPDATE ---
            if existing.data:
                # Nếu có dữ liệu, maybe_single() trả về dict, không phải list
                roadmap_id = existing.data.get("id") 
                if not roadmap_id:
                     # Fallback nếu maybe_single trả về list [dict] thay vì dict
                     roadmap_id = existing.data[0]["id"] if isinstance(existing.data, list) and existing.data else None
                
                if roadmap_id:
                    result = (
                        admin_supabase.table("roadmaps")
                        .update(insert_data)
                        .eq("id", roadmap_id)
                        .execute()
                    )
                    if not result.data: # Kiểm tra xem UPDATE có thất bại không
                        raise Exception("Cập nhật roadmap thất bại (Không có dữ liệu trả về)")
                    logger.info(f"UPDATED roadmap for user {payload_data.user_id}")
                else:
                    logger.warning("Không tìm thấy ID roadmap để cập nhật. Thử INSERT mới.")
                    
                    # Thử INSERT nếu UPDATE thất bại
                    result = (
                        admin_supabase.table("roadmaps")
                        .insert(insert_data)
                        .execute()
                    )
                    if not result.data:
                         raise Exception("Lưu roadmap mới (fallback) thất bại")
                    logger.info(f"INSERTED new roadmap (fallback) for user {payload_data.user_id}")

            # --- 4C. Nếu chưa có → INSERT ---
            else:
                result = (
                    admin_supabase.table("roadmaps")
                    .insert(insert_data)
                    .execute()
                )
                if not result.data: # Kiểm tra xem INSERT có thất bại không
                    raise Exception("Lưu roadmap mới thất bại (Không có dữ liệu trả về)")
                logger.info(f"INSERTED new roadmap for user {payload_data.user_id}")

        except Exception as e:
            logger.error(f"❌ Lỗi lưu roadmap vào Supabase: {e}")
            # Nếu lưu thất bại, ta vẫn trả về lộ trình để Frontend hiển thị tạm thời
        
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
        logger.error(f"JSON từ Gemini không hợp lệ: {e}")
        raise HTTPException(status_code=500, detail="Lỗi định dạng JSON từ AI")
    except Exception as e:
        logger.error(f"Lỗi tạo Roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi tạo lộ trình: {str(e)}")
    
logger = logging.getLogger(__name__)

def get_user_roadmap(user_id: str):
    try:
        res = (
            admin_supabase.table("roadmaps")
            .select("id, user_id, level, data, created_at, updated_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        # Nếu res.data là list chứa 1 dict (bình thường)
        if res.data and isinstance(res.data, list) and len(res.data) > 0:
            return res.data[0]  # trả whole row: {'id', 'user_id', 'level', 'data', ...}
        else:
            logger.warning(f"Không tìm thấy roadmap cho user: {user_id}. Supabase response: {res.data}")
            return None

    except Exception as e:
        logger.error(f"Error fetching roadmap: {e}")
        return None