from supabase import Client
from typing import List, Dict, Any
from postgrest import APIResponse 

def get_scenarios_by_topic_and_level(db: Client, topic: str, level: str) -> List[Dict[str, Any]]:
    """Lấy danh sách scenario (id, title)."""
    try:
        response = db.table("scenarios").select("id, title").eq("topic", topic).eq("level", level).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"DB Error (get_scenarios): {e}")
        raise

def get_scenario_by_id_with_dialogues(db: Client, scenario_id: str) -> Dict[str, Any] | None:
    """Lấy scenario full kèm câu thoại."""
    try:
        response = db.table("scenarios").select("*, dialogue_lines(*)").eq("id", scenario_id).single().execute()
        if response.data:
            scenario = response.data
            if 'dialogue_lines' in scenario and scenario['dialogue_lines']:
                # Sort theo turn
                scenario['dialogue_lines'] = sorted(scenario['dialogue_lines'], key=lambda x: x['turn'])
            return scenario
        return None
    except Exception as e:
        print(f"DB Error (get_scenario_detail): {e}")
        raise

#  HÀM SEEDING 
def get_scenario_by_title(db: Client, title: str) -> Dict[str, Any] | None:
    """
    Tìm một kịch bản bằng tiêu đề chính xác của nó.
    """
    if not db:
        raise ConnectionError("Database client is not initialized.")
    try:
        response = db.table("scenarios").select("*").eq("title", title).limit(1).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f" LỖI DATABASE trong get_scenario_by_title: {e}")
        raise

def create_scenario_with_dialogues(db: Client, scenario_data: Dict[str, Any], dialogue_data: List[Dict[str, Any]]):
    """
    Tạo một kịch bản mới và các câu thoại đi kèm.
    """
    if not db:
        raise ConnectionError("Database client is not initialized.")
    try:
        scenario_response = db.table("scenarios").insert(scenario_data).execute()
        if not scenario_response.data:
            raise Exception("Không thể tạo bản ghi scenario.")
        
        new_scenario_id = scenario_response.data[0]['id']

        for line in dialogue_data:
            line['scenario_id'] = new_scenario_id

        dialogue_response = db.table("dialogue_lines").insert(dialogue_data).execute()
        if not dialogue_response.data:
            db.table("scenarios").delete().eq("id", new_scenario_id).execute()
            raise Exception("Không thể tạo các câu thoại.")

        return scenario_response.data[0]
    except Exception as e:
        print(f" LỖI DATABASE trong create_scenario_with_dialogues: {e}")
        raise