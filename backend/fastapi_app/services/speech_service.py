import tempfile
from fastapi_app.schemas.speech_schemas import SpeechResult, WordCompare
from faster_whisper import WhisperModel  # dùng faster-whisper

_model = None

def _get_model():
    global _model
    if _model is None:
        _model = WhisperModel("small", device="cpu")  # device="cpu" hoặc "cuda"
    return _model

def compare_words(target: str, spoken: str):
    target_words = target.lower().split()
    spoken_words = spoken.lower().split()

    result = []
    for i, w in enumerate(target_words):
        correct = (i < len(spoken_words) and spoken_words[i] == w)
        result.append(WordCompare(word=w, correct=correct))
    return result

async def evaluate_audio(file, text: str) -> SpeechResult:
    # Tạo file tạm chứa audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp.flush()

        model = _get_model()
        segments, info = model.transcribe(tmp.name)  # không cần ffmpeg
        transcript = " ".join([seg.text for seg in segments])

    compared = compare_words(text, transcript)

    return SpeechResult(
        transcript=transcript,
        compare=compared
    )
