from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from fastapi_app.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("auth.users.id"), nullable=False)
    badge = Column(Integer, default=1)
    last_login_date = Column(Date, nullable=True)
