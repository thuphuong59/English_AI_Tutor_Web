from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    user_role: str # Thêm trường role để Frontend có thể chuyển hướng