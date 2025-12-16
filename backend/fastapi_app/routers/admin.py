from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..dependencies import get_admin_user_id
from ..database import admin_supabase,db_client
from ..crud import admin_users as admin_crud
from ..schemas.admin import AdminUserUpdate, MessageDetail, SessionDetail, SessionOverview
from ..schemas.admin import AdminUserDetail, UpdateUserStatus, UpdateUserRole

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
    dependencies=[Depends(get_admin_user_id)]
)

@router.get("/users", response_model=List[AdminUserDetail])
async def list_users(search: Optional[str] = Query(None)): # Nhận tham số search từ URL
    """Lấy danh sách user, hỗ trợ tìm kiếm."""
    try:
        # Truyền search vào CRUD
        users_data = admin_crud.get_all_user_details(db=db_client, search_query=search)
        return [AdminUserDetail(**u) for u in users_data]
    except Exception as e:
        print(f"API Error (list_users): {e}")
        raise HTTPException(status_code=500, detail="Could not fetch user list.")

@router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, status_data: UpdateUserStatus):
    try:
        response = admin_crud.update_user_status_in_db(
            db=admin_supabase, user_id=user_id, new_status=status_data
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"message": "Status updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role_data: UpdateUserRole):
    try:
        response = admin_crud.update_user_role_in_db(
            db=admin_supabase, user_id=user_id, new_role=role_data
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"message": "Role updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --- 1. API: Lấy chi tiết User ---
@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user_detail(user_id: str):
    """Lấy thông tin chi tiết của một user cụ thể."""
    user_data = admin_crud.get_user_by_id(db=db_client, user_id=user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found.")
    return AdminUserDetail(**user_data)

# --- 2. API: Xóa User ---
@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Xóa người dùng khỏi hệ thống."""
    success = admin_crud.delete_user_in_db(db=db_client, user_id=user_id)
    if not success:
        # Có thể user không tồn tại hoặc lỗi DB
        raise HTTPException(status_code=400, detail="Failed to delete user or user not found.")
    
    return {"message": f"User {user_id} deleted successfully."}
@router.get("/users/{user_id}/sessions", response_model=List[SessionOverview])
async def list_user_sessions(user_id: str):
    return [SessionOverview(**s) for s in admin_crud.get_user_sessions(db=db_client, user_id=user_id)]

# API: Lấy chi tiết nội dung Session
@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session_detail(session_id: str):
    # 1. Lấy thông tin chung
    overview_data = admin_crud.get_session_overview(db=db_client, session_id=session_id)
    if not overview_data:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # 2. Lấy danh sách tin nhắn
    messages_data = admin_crud.get_session_messages(db=db_client, session_id=session_id)
    
    return SessionDetail(
        overview=SessionOverview(**overview_data), # Map data vào schema
        messages=[MessageDetail(**m) for m in messages_data]
    )
@router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: AdminUserUpdate):
    """Cập nhật thông tin user (Username, Role, Status, Badge)"""
    try:
        updated_user = admin_crud.update_user_in_db(db=db_client, user_id=user_id, update_data=user_data)
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found or update failed.")
            
        return {"message": "User updated successfully", "data": updated_user}
        
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")