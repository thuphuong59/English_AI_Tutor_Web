from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from typing import List
from fastapi_app.schemas import quiz_grammar_schemas as schemas
from fastapi_app.dependencies import get_current_user_id
from fastapi_app.services import quiz_grammar_service 
from fastapi_app.database import admin_supabase # Cần thiết cho CRUD

router = APIRouter(
    prefix="/quiz-grammar", 
    tags=["Quiz - Grammar"],
    dependencies=[Depends(get_current_user_id)]
)

@router.post("/start", response_model=schemas.QuizSessionStartResponse)
async def start_grammar_quiz(
    topic_req: schemas.GrammarTopicRequest, 
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    # Logic post giữ nguyên, giả định hàm service đã được sửa để xử lý sync/async đúng.
    is_completed = await quiz_grammar_service.check_if_lesson_completed(user_id, topic_req.lesson_id)
    if is_completed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bài kiểm tra này đã được hoàn thành. Không thể làm lại.")

    session = await quiz_grammar_service.create_new_quiz_session(
        user_id=user_id, 
        topic_name=topic_req.topic_name,
        lesson_id=topic_req.lesson_id 
    )
    
    background_tasks.add_task(
        quiz_grammar_service.generate_quiz_questions, 
        session['id'], 
        topic_req.topic_name, 
        user_id
    )

    return {"id": session['id']} 

@router.get("/{session_id}/questions", response_model=List[schemas.QuizQuestionInDB])
async def get_quiz_questions(session_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Lấy câu hỏi đã được AI tạo. Frontend dùng endpoint này để Polling.
    Endpoint: GET /api/quiz-grammar/{session_id}/questions
    """
    if admin_supabase is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database client is not initialized.")
        
    # 1. Kiểm tra trạng thái Session
    try:
        # SỬA LỖI: BỎ 'await' TRƯỚC LỆNH GỌI DB (nếu client là Sync)
        session_res = admin_supabase.table("QuizSessions") \
            .select("status") \
            .eq("id", session_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        # KIỂM TRA DỮ LIỆU AN TOÀN TRƯỚC KHI TRUY CẬP
        if not session_res.data or session_res.data.get("status") is None:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz session not found.")
        
        session_status = session_res.data["status"]

        if session_status == 'GENERATING' or session_status == 'ERROR':
            # Trả về mảng rỗng nếu chưa sẵn sàng
            return []
            
    except HTTPException:
        # Nếu đã ném HTTPException (404), giữ nguyên
        raise
    except Exception as e:
        # Bắt các lỗi khác (lỗi kết nối, lỗi PostgREST)
        print(f"Error fetching session status for {session_id}: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz session not found or access denied due to error.")

    # 2. Lấy câu hỏi nếu trạng thái là READY hoặc COMPLETED
    try:
        # SỬA LỖI: BỎ 'await' TRƯỚC LỆNH GỌI DB (nếu client là Sync)
        questions_res = admin_supabase.table("QuizQuestions") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("id") \
            .execute()
        
        return questions_res.data
    except Exception as e:
         print(f"Error fetching questions for {session_id}: {e}")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve questions.")


@router.post("/{session_id}/submit", response_model=schemas.QuizResultSummary)
async def submit_quiz_answers(
    session_id: int, 
    submission: schemas.QuizSubmission, 
    user_id: str = Depends(get_current_user_id)
):
    # Logic submission giữ nguyên
    if submission.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User mismatch.")
        
    results = await quiz_grammar_service.grade_and_track_quiz(
        session_id=session_id, 
        user_id=user_id, 
        answers=submission.answers
    )
    
    return results