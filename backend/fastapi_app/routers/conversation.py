import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body
from fastapi_app.dependencies import get_current_user
from fastapi_app.schemas import conversation as schemas
from fastapi_app.services import conversation as conversation_service
from fastapi_app.crud import history as crud_history
from fastapi_app.utils.gemini_retry import with_gemini_retry # Giả định import này đã đúng
from pyexpat import model # Giả định model là một đối tượng được định nghĩa ở đâu đó
from typing import List, Optional
@with_gemini_retry(max_retries=3, initial_delay=4) # Chờ 4s nếu lỗi
def call_gemini_api(prompt, content):
    # Dòng này sẽ gây lỗi nếu model không được định nghĩa, nhưng tôi giữ nguyên theo code gốc
    response = model.generate_content([prompt, content])
    return response

router = APIRouter(prefix="/conversation", tags=["Conversation"])

@router.post("/start", response_model=schemas.StartConversationResponse)
# 🚨 FIX CỰC ĐOAN: Tạm thời chỉ nhận JSON thô (dict) để tránh lỗi validation Pydantic ban đầu
async def start_conversation(
    raw_body: dict = Body(..., embed=False), 
    current_user=Depends(get_current_user)
):
    try:
        # 1. THỰC HIỆN PARSING PYDANTIC THỦ CÔNG BÊN TRONG HÀM
        req = schemas.StartConversationRequest(**raw_body)
    except Exception as e:
        # Nếu parsing thất bại, trả về lỗi 422 chi tiết
        raise HTTPException(status_code=422, detail=f"Validation Error: {e}")

    # 2. XÁC ĐỊNH lesson_id (Không cần Fallback nếu parsing thủ công đã thành công)
    lesson_id_to_use = req.lesson_id
    
    print(f"DEBUG ROUTER: lesson_id FINAL USED: {lesson_id_to_use}")

    # 3. Logic kiểm tra bắt buộc (Nếu Pydantic bỏ sót kiểm tra)
    if not req.mode or not req.level:
        raise HTTPException(status_code=422, detail="Missing required fields: mode or level")

    try:
        return await conversation_service.start_conversation(
            mode=req.mode,
            level=req.level,
            scenario_id=req.scenario_id,
            topic=req.topic,
            user_id=current_user.id,
            lesson_id=lesson_id_to_use 
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.post("/chat/free-talk", response_model=schemas.ChatResponse)
async def free_talk_message(req: schemas.FreeTalkMessageRequest, current_user=Depends(get_current_user)):
    session = conversation_service.get_session_details(req.session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not authorized")
    try:
        return await conversation_service.generate_free_talk_reply(
            message=req.message, topic=req.topic, level=req.level, session_id=req.session_id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API xử lý Voice Multimodal cho Free Talk
@router.post("/chat/free-talk-voice")
async def free_talk_voice(
    audio: UploadFile = File(...),
    history: str = Form(...), # Nhận history dạng string nhưng trong flow mới chúng ta dùng context từ DB là chính
    topic: str = Form(...),
    level: str = Form(...),
    session_id: str = Form(...),
    current_user=Depends(get_current_user)
):
    session = conversation_service.get_session_details(session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not authorized")
    try:
        # Flow: Audio -> Upload -> Model (Transcribe + Reply)
        return await conversation_service.process_free_talk_voice(
            audio=audio, topic=topic, level=level, session_id=session_id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API xử lý Voice Multimodal cho Scenario
@router.post("/evaluate-scenario-voice", response_model=schemas.EvaluateVoiceResponse)
async def evaluate_scenario_voice(
    audio: UploadFile = File(...),
    scenario_id: str = Form(...),
    level: str = Form(...),
    current_turn: int = Form(...),
    session_id: str = Form(...),
    current_user=Depends(get_current_user)
):
    session = conversation_service.get_session_details(session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not authorized")
    try:
        return await conversation_service.evaluate_scenario_voice(
            audio=audio, scenario_id=scenario_id, level=level, turn=current_turn, session_id=session_id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(current_user=Depends(get_current_user)):
    return conversation_service.get_all_sessions(current_user.id)

@router.get("/history/{session_id}")
async def get_conversation_details(session_id: str, current_user=Depends(get_current_user)):
    session = conversation_service.get_session_details(session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not authorized")
    return session

@router.get("/scenarios", response_model=List[schemas.ScenarioInfo])
def get_scenarios(topic: str = Query(...), level: str = Query(...)):
    return conversation_service.get_scenarios_for_topic(topic, level)

@router.post("/summarize-conversation", response_model=schemas.SummarizeResponse)
async def summarize_conversation_endpoint(data: schemas.SummarizeRequest, current_user=Depends(get_current_user)):
    session = conversation_service.get_session_details(data.session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not authorized")
    
    msgs_list = [m.dict() for m in data.history] if data.history else None
    try:
        return await conversation_service.summarize_conversation(
            session_id=data.session_id, topic=data.topic, level=data.level, messages=msgs_list
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{session_id}")
async def delete_conversation_session(session_id: str, current_user=Depends(get_current_user)):
    session = conversation_service.get_session_details(session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not authorized")
    # Tốt nhất nên gọi service.delete_session thay vì crud trực tiếp
    conversation_service.delete_session(session_id, current_user.id)
    return {"message": "Deleted"}