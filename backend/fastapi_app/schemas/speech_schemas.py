from pydantic import BaseModel
from typing import List

class WordCompare(BaseModel):
    word: str
    correct: bool

class SpeechResult(BaseModel):
    transcript: str
    compare: List[WordCompare]
