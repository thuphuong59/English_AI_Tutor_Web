# from typing import Optional
# from pydantic import BaseModel, EmailStr

# class UserCreate(BaseModel):
#     email: EmailStr
#     password: str
#     username: str | None = None

# class UserLogin(BaseModel):
#     email: EmailStr
#     password: str

# class UserResponse(BaseModel):
#     id: str
#     email: str
#     username: Optional[str] = None