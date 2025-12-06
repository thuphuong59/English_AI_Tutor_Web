from fastapi import APIRouter, UploadFile, File, Form
from fastapi_app.services.speech_service import evaluate_audio
from fastapi_app.schemas.speech_schemas import SpeechResult

router = APIRouter(prefix="/speech", tags=["Speech"])

@router.post("/evaluate", response_model=SpeechResult)
async def evaluate_speech(
    audio: UploadFile = File(...),
    text: str = Form(...)
):
    return await evaluate_audio(audio, text)
