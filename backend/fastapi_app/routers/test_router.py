from fastapi import APIRouter, HTTPException
from fastapi_app.schemas.test_schemas import PreferenceData, InitialQuizResponse
from fastapi_app.services.test_service import generate_initial_quiz

# Note: We only define the router once and use a descriptive prefix/tag.
router = APIRouter(prefix="/quiz", tags=["Quiz Generation"]) # 🚨 Changed prefix to /quiz to match the Frontend call URL structure: /quiz/generate_communication_diagnostic

# We can remove the unused imports (Depends, BackgroundTasks) and the redundant router definition.

@router.post("/test", response_model=InitialQuizResponse, status_code=201)
async def generate_diagnostic_quiz_endpoint(
    prefs: PreferenceData # FastAPI automatically parses JSON body into PreferenceData
):
    """
    Endpoint receives user preferences and triggers the initial communication diagnostic quiz generation using LLM.
    """
    try:
        quiz_data = await generate_initial_quiz(prefs)
        return quiz_data
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))