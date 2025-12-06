import json
from pyexpat import model
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body
from fastapi_app.utils.gemini_retry import with_gemini_retry

from fastapi_app.dependencies import get_current_user
from fastapi_app.schemas import conversation as schemas
from fastapi_app.services import conversation as conversation_service
from fastapi_app.crud import history as crud_history

@with_gemini_retry(max_retries=3, initial_delay=4) # Chờ 4s nếu lỗi
def call_gemini_api(prompt, content):
    response = model.generate_content([prompt, content])
    return response
router = APIRouter(prefix="/conversation", tags=["Conversation"])

@router.post("/start", response_model=schemas.StartConversationResponse)
async def start_conversation(req: schemas.StartConversationRequest, current_user=Depends(get_current_user)):
    try:
        return await conversation_service.start_conversation(
            mode=req.mode, level=req.level, scenario_id=req.scenario_id, topic=req.topic, user_id=current_user.id
        )
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{session_id}")
async def delete_conversation_session(session_id: str, current_user=Depends(get_current_user)):
    session = conversation_service.get_session_details(session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not authorized")
    crud_history.delete_session(conversation_service.admin_supabase, session_id, current_user.id)
    return {"message": "Deleted"}