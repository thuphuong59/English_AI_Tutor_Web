import os
import shutil
import tempfile
import google.generativeai as genai
from fastapi import UploadFile

# Cấu hình API Key (đảm bảo đã set biến môi trường)
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found.")
genai.configure(api_key=GEMINI_API_KEY)

async def upload_audio_to_gemini(audio_file: UploadFile):
    """
    1. Lưu UploadFile (từ RAM/Network) xuống file tạm trên ổ cứng.
    2. Upload file đó lên Google Generative AI Files API.
    3. Trả về đối tượng file của Gemini (để đưa vào prompt).
    """
    suffix = ".webm"  # Mặc định browser gửi webm, hoặc lấy từ filename
    if audio_file.filename and "." in audio_file.filename:
        suffix = "." + audio_file.filename.split(".")[-1]

    # 1. Tạo file tạm
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        # Ghi dữ liệu từ UploadFile vào file tạm
        content = await audio_file.read()
        tmp.write(content)

    try:
        # 2. Upload lên Google
        # mime_type quan trọng để Gemini biết đây là audio
        mime_type = audio_file.content_type or "audio/webm"
        uploaded_file = genai.upload_file(path=tmp_path, mime_type=mime_type)
        
        print(f"[Gemini Upload] Uploaded file: {uploaded_file.uri}")
        return uploaded_file
        
    except Exception as e:
        print(f"[Gemini Upload Error] {e}")
        raise e
    finally:
        # 3. Dọn dẹp file tạm trên server (Local)
        if os.path.exists(tmp_path):
            os.remove(tmp_path)