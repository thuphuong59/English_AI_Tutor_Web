from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from fastapi_app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    password = Column(String)

    profile = relationship("Profile", back_populates="user", uselist=False)
