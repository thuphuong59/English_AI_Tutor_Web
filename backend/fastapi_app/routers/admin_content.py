# fastapi_app/routers/admin_content.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..dependencies import get_admin_user_id
from ..database import db_client
from ..crud import admin_content as crud
from ..schemas.admin import (
    DeckResponse, DeckCreate, DeckUpdate,
    VocabResponse, VocabCreate, VocabUpdate
)

router = APIRouter(
    prefix="/admin/content",
    tags=["Admin Content (Decks & Vocab)"],
    dependencies=[Depends(get_admin_user_id)]
)

# ================== DECKS API ==================

@router.get("/decks", response_model=List[DeckResponse])
async def list_decks(search: Optional[str] = Query(None)):
    return crud.get_all_decks(db_client, search)

@router.post("/decks", response_model=DeckResponse)
async def create_new_deck(deck: DeckCreate):
    data = crud.create_deck(db_client, deck.model_dump())
    if not data: raise HTTPException(400, "Failed to create deck")
    data['word_count'] = 0 # Mới tạo chưa có từ
    return data

@router.put("/decks/{deck_id}", response_model=DeckResponse)
async def update_existing_deck(deck_id: str, deck: DeckUpdate):
    data = crud.update_deck(db_client, deck_id, deck.model_dump(exclude_unset=True))
    if not data: raise HTTPException(404, "Deck not found")
    # Lấy lại word count cho đúng format
    return crud.get_all_decks(db_client)[0] # Hack nhanh để lấy full data, hoặc query lại

@router.delete("/decks/{deck_id}")
async def delete_existing_deck(deck_id: str):
    if crud.delete_deck(db_client, deck_id):
        return {"message": "Deck deleted successfully"}
    raise HTTPException(400, "Failed to delete deck")

# ================== VOCAB API ==================

@router.get("/decks/{deck_id}/vocab", response_model=List[VocabResponse])
async def list_vocab_in_deck(deck_id: str, search: Optional[str] = Query(None)):
    return crud.get_vocab_by_deck(db_client, deck_id, search)

@router.post("/vocab", response_model=VocabResponse)
async def add_vocab(vocab: VocabCreate):
    data = crud.create_vocab(db_client, vocab.model_dump())
    if not data: raise HTTPException(400, "Failed to add vocabulary")
    return data

@router.put("/vocab/{vocab_id}", response_model=VocabResponse)
async def edit_vocab(vocab_id: str, vocab: VocabUpdate):
    data = crud.update_vocab(db_client, vocab_id, vocab.model_dump(exclude_unset=True))
    if not data: raise HTTPException(404, "Vocabulary not found")
    return data

@router.delete("/vocab/{vocab_id}")
async def remove_vocab(vocab_id: str):
    if crud.delete_vocab(db_client, vocab_id):
        return {"message": "Vocabulary deleted"}
    raise HTTPException(400, "Failed to delete vocabulary")