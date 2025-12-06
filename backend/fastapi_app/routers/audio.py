from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from gtts import gTTS
import io

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    API chuyển đổi văn bản thành giọng nói sử dụng Google Translate TTS.
    Trả về file audio dạng stream (mp3).
    """
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text is required")

        # Tạo file audio trong bộ nhớ (không lưu ra đĩa để tiết kiệm)
        mp3_fp = io.BytesIO()
        
        # lang='en' cho tiếng Anh, tld='us' cho giọng Mỹ (hoặc 'co.uk' cho giọng Anh)
        tts = gTTS(text=request.text, lang='en', tld='us')
        tts.write_to_fp(mp3_fp)
        
        # Đưa con trỏ file về đầu để đọc
        mp3_fp.seek(0)

        return StreamingResponse(mp3_fp, media_type="audio/mpeg")

    except Exception as e:
        print(f"Error in TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))