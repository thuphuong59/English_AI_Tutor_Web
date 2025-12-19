from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..dependencies import get_admin_user_id
from ..database import db_client
from ..crud import admin_scenarios as crud
from ..schemas import ScenarioResponse, ScenarioCreate

router = APIRouter(
    prefix="/admin/scenarios",
    tags=["Admin Scenarios"],
    dependencies=[Depends(get_admin_user_id)]
)

@router.get("/", response_model=List[ScenarioResponse])
async def list_scenarios(search: Optional[str] = Query(None)):
    return crud.get_all_scenarios(db_client, search)

@router.post("/", response_model=ScenarioResponse)
async def create_new_scenario(scenario: ScenarioCreate):
    data = crud.create_scenario(db_client, scenario.model_dump())
    if not data: raise HTTPException(400, "Failed to create scenario")
    return data

@router.delete("/{scenario_id}")
async def delete_existing_scenario(scenario_id: str):
    if crud.delete_scenario(db_client, scenario_id):
        return {"message": "Scenario deleted"}
    raise HTTPException(400, "Failed to delete scenario")

@router.put("/{scenario_id}", response_model=ScenarioResponse)
async def update_existing_scenario(scenario_id: str, scenario: ScenarioCreate): 
    # Dùng ScenarioCreate vì cấu trúc gửi lên giống hệt lúc tạo (kèm dialogues)
    data = crud.update_scenario(db_client, scenario_id, scenario.model_dump())
    if not data: 
        raise HTTPException(404, "Scenario not found or update failed")
    return data