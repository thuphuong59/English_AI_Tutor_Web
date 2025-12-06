import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi_app.schemas.check_grammar_schemas import GrammarRequest, GrammarResponse
from fastapi_app.services.check_grammar_service import check_grammar_service

router = APIRouter()

@router.post("/check_grammar", response_model=GrammarResponse)
def check_grammar(req: GrammarRequest):
    return check_grammar_service(req)
