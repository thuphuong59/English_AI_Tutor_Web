from pydantic import BaseModel
from typing import List


class GrammarRequest(BaseModel):
    text: str


class GrammarError(BaseModel):
    message: str
    suggestions: List[str]
    offset: int
    length: int

class GrammarResponse(BaseModel):
    corrected_text: str
    count: int
    errors: List[GrammarError]