import google.generativeai as genai
from fastapi import UploadFile
import os
from fastapi_app.prompts.pronunciation import PRONUNCIATION_COACH_PROMPT 

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

async def process_freestyle_pronunciation(audio_file: UploadFile, accent: str):
    audio_data = await audio_file.read()
    
    # Xác định giọng đọc mục tiêu để AI chấm điểm chính xác
    accent_name = "British English" if accent == "en-GB" else "American English"
    custom_prompt = f"Target Accent for evaluation: {accent_name}. {PRONUNCIATION_COACH_PROMPT}"
    
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-preview-09-2025",
        generation_config={"response_mime_type": "application/json"}
    )
    
    response = await model.generate_content_async(
        contents=[
            {
                "role": "user",
                "parts": [
                    {"text": custom_prompt},
                    {
                        "inline_data": {
                            "mime_type": audio_file.content_type or "audio/wav",
                            "data": audio_data
                        }
                    }
                ]
            }
        ]
    )
    return response.text