from fastapi import APIRouter, UploadFile, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Dict, List
from fastapi_app.schemas.test_schemas import FinalAssessmentSubmission
from fastapi_app.services.assessment_service import analyze_and_generate_roadmap, get_user_roadmap
import json
import logging
import starlette

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assessment", tags=["Assessment & Roadmap"])

@router.post("/submit_and_analyze")
async def submit_assessment(request: Request):
    """
    Nhận FormData từ frontend:
    - payload: JSON string chứa MCQ + speaking_data + preferences
    - audio_file_xx: file audio
    """
    # Ghi log headers để debug Content-Type, boundary...
    logger.info(f"[submit_assessment] Request headers: {dict(request.headers)}")

    form = await request.form()

    # Ghi log toàn bộ form keys và value types để debug
    logger.info("[submit_assessment] Dump form items and types for debug:")
    for k, v in form.multi_items():
        try:
            typename = type(v).__name__
            # Nếu là UploadFile, có attribute filename
            filename = getattr(v, "filename", None)
            logger.info(f" - form key = {k!r}, type = {typename}, filename = {filename}")
        except Exception as e:
            logger.exception("Error while logging form item", exc_info=e)

    # Parse payload
    payload_str = form.get("payload")
    if not payload_str:
        # Nếu không tìm thấy payload, log và trả lỗi chi tiết
        logger.error("[submit_assessment] Không tìm thấy 'payload' trong form. Form keys: %s",
                     list(dict(form).keys()))
        raise HTTPException(status_code=400, detail="Không tìm thấy payload trong form.")

    try:
        submission_data_dict = json.loads(payload_str)
        submission_data = FinalAssessmentSubmission(**submission_data_dict)
    except Exception as e:
        logger.exception("Lỗi parse payload JSON")
        raise HTTPException(status_code=400, detail=f"Lỗi parse payload JSON: {str(e)}")

    # Tạo dict mapping key => UploadFile, dùng nhiều cách kiểm tra để chắc chắn
    file_map: Dict[str, UploadFile] = {}
    for key, value in form.multi_items():
        # Nhiều môi trường trả về starlette.datastructures.UploadFile
        if isinstance(value, starlette.datastructures.UploadFile) or isinstance(value, UploadFile):
            file_map[key] = value
            logger.info(f"[submit_assessment] Thêm file vào map (is UploadFile): {key} -> {value.filename}")
        else:
            # Fallback: nếu object có thuộc tính filename và file, coi như file
            if hasattr(value, "filename") and hasattr(value, "file"):
                try:
                    file_map[key] = value  # type: ignore
                    logger.info(f"[submit_assessment] Thêm file vào map (has filename/file): {key} -> {value.filename}")
                except Exception:
                    logger.warning(f"[submit_assessment] Thấy trường có filename nhưng không thể thêm: {key} -> {getattr(value,'filename',None)}")
            else:
                logger.info(f"[submit_assessment] Trường không phải file: {key} (type {type(value).__name__})")

    logger.info(f"[submit_assessment] Tổng files nhận được: {len(file_map)} keys: {list(file_map.keys())}")

    # Gọi service
    try:
        roadmap = await analyze_and_generate_roadmap(submission_data, file_map)
        return roadmap
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Lỗi server khi phân tích")
        logger.exception(f"❌ [CRASH] Lỗi tại analyze_and_generate_roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi server khi phân tích: {str(e)}")

@router.get("/{user_id}")
async def fetch_roadmap(user_id: str):
    """
    Truy xuất Roadmap gần nhất của người dùng.
    Trả về 404 nếu không tìm thấy.
    """
    # Hàm get_user_roadmap đã được sửa để trả về None nếu không tìm thấy/lỗi
    data = get_user_roadmap(user_id) 

    if not data:
        # 🚨 ĐÃ SỬA: Dùng HTTPException 404 khi Roadmap rỗng
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lộ trình học tập cho user này. Vui lòng hoàn thành bài đánh giá."
        )

    # Nếu tìm thấy dữ liệu (data không phải None)
    return {
        "status": "success",
        "level": data.get("level"),
        "roadmap": data.get("data"), 
        "created_at": data.get("created_at"),
        "updated_at": data.get("updated_at"),
    }