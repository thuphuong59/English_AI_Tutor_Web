from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from fastapi_app.routers import analysis
from fastapi_app.routers import (
    auth, conversation, user, vocabulary, 
    decks, public_decks, grammar_check, quizgame
)
from fastapi_app.routers import audio
# Thêm imports từ phiên bản đến (bỏ đi các imports bị trùng)
from fastapi_app.routers import test_router, check_grammar_router, speech_router, assessment_router
# Lưu ý: 'auth_router' trùng với 'auth' đã có, nên tôi dùng 'auth'

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH)

# Tạo FastAPI app với cấu hình chi tiết (từ HEAD)
app = FastAPI(
    title="English Tutor API",
    description="AI-powered English conversation practice",
    version="1.0.0"
)

# Cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đính kèm tất cả các Router (Kết hợp HEAD và phiên bản đến)
# Routers từ HEAD:
app.include_router(auth.router)
app.include_router(conversation.router)
app.include_router(user.router)
app.include_router(vocabulary.router, prefix="/api")
app.include_router(decks.router, prefix="/api")
app.include_router(public_decks.router, prefix="/api")
app.include_router(analysis.router, prefix="/api") 
app.include_router(grammar_check.router, prefix="/api")
app.include_router(quizgame.router, prefix="/api")
app.include_router(audio.router, prefix="/audio", tags=["audio"])

# Routers từ phiên bản đến:
app.include_router(test_router.router)
app.include_router(check_grammar_router.router)
# Auth router đã có, nên không include lại
app.include_router(speech_router.router)
app.include_router(assessment_router.router)


@app.get("/") 
async def root():
    return {
        "status": "online",
        "service": "English Tutor API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0",
        port=8000,
        reload=True
    )
