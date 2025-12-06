from fastapi import APIRouter, Depends, HTTPException
from fastapi_app import schemas
from fastapi_app.dependencies import get_current_user_id
from fastapi_app.crud import history as history_crud
from fastapi_app.crud import vocabulary as vocab_crud
from fastapi_app.services import vocabulary as vocab_service
from fastapi_app.database import admin_supabase

router = APIRouter(
    prefix="/analysis", 
    tags=["AI Analysis"],
    dependencies=[Depends(get_current_user_id)]
)

@router.post("/", response_model=schemas.AnalyzeResponse)
async def analyze_conversation_session(
    session_data: schemas.ConversationSession, 
    user_id: str = Depends(get_current_user_id)
):
    try:
        json_transcript = history_crud.get_session_messages_by_id(
            db=admin_supabase, 
            session_id=session_data.session_id, 
            user_id=user_id
        )
        
        final_suggestions = await vocab_service.analyze_and_enrich_transcript(
            transcript_json=json_transcript,
            user_id=user_id
        )
        
        if not final_suggestions:
            return {"message": "No new unique suggestions found.", "words_added": 0}

        words_added = vocab_crud.create_suggestions_for_user(final_suggestions, user_id)
        
        return {"message": "Analysis complete.", "words_added": words_added}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))