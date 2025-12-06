import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi_app.schemas.grammar_check import GrammarRequest, GrammarResponse
from fastapi_app.services.grammar_check import grammar_check_service

router = APIRouter()

@router.post("/grammar_check", response_model=GrammarResponse)
def check_grammar(req: GrammarRequest):
    return grammar_check_service(req)