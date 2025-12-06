
from pydantic import BaseModel

class UpdateUserRequest(BaseModel):
    username: str | None = None
    avatar_url: str | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
