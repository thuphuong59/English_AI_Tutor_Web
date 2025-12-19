from typing import List, Dict, Any, Optional

TABLE_SCENARIOS = 'scenarios'
TABLE_DIALOGUES = 'dialogue_lines'

def get_all_scenarios(db: Any, search: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        query = db.from_(TABLE_SCENARIOS).select("*, dialogue_lines(*)").order("id", desc=True)
        if search:
            query = query.ilike("title", f"%{search}%")
        
        response = query.execute()
        # Supabase trả về nested dialogues trong key 'scenario_dialogues'
        # Ta cần map lại key 'scenario_dialogues' thành 'dialogues' để khớp Schema nếu cần
        data = response.data
        for item in data:
            item['dialogues'] = item.get('dialogue_lines', [])
            # Sắp xếp dialogue theo turn
            item['dialogues'].sort(key=lambda x: x['turn'])
            
        return data
    except Exception as e:
        print(f"DB Error (get_scenarios): {e}")
        return []

def create_scenario(db: Any, data: dict) -> Dict[str, Any]:
    try:
        # 1. Tách dialogues ra khỏi data scenario
        dialogues = data.pop('dialogues', [])
        
        # 2. Tạo Scenario trước
        scenario_res = db.from_(TABLE_SCENARIOS).insert(data).execute()
        if not scenario_res.data: return None
        
        new_scenario = scenario_res.data[0]
        scenario_id = new_scenario['id']
        
        # 3. Tạo Dialogues kèm scenario_id
        if dialogues:
            dialogue_payload = [{**d, "scenario_id": scenario_id} for d in dialogues]
            db.from_(TABLE_DIALOGUES).insert(dialogue_payload).execute()
            
        return new_scenario
    except Exception as e:
        print(f"DB Error (create_scenario): {e}")
        return None

def delete_scenario(db: Any, scenario_id: str) -> bool:
    try:
        # Xóa dialogues trước (nếu không set cascade ở DB)
        db.from_(TABLE_DIALOGUES).delete().eq("scenario_id", scenario_id).execute()
        # Xóa scenario
        res = db.from_(TABLE_SCENARIOS).delete().eq("id", scenario_id).execute()
        return True if res.data else False
    except Exception as e:
        return False
    
def update_scenario(db: Any, scenario_id: str, data: dict) -> Dict[str, Any]:
    try:
        # 1. Tách dialogues
        dialogues = data.pop('dialogues', [])
        
        # 2. Cập nhật thông tin chính (Title, Topic, Level)
        update_res = db.from_(TABLE_SCENARIOS).update(data).eq("id", scenario_id).execute()
        if not update_res.data:
            return None
            
        updated_scenario = update_res.data[0]

        # 3. Cập nhật Dialogues (Xóa hết cũ -> Thêm mới)
        # Lưu ý: Cách này đơn giản nhất. Nếu cần giữ lịch sử ID của câu thoại thì phức tạp hơn.
        if dialogues:
            # Xóa cũ
            db.from_(TABLE_DIALOGUES).delete().eq("scenario_id", scenario_id).execute()
            
            # Thêm mới
            dialogue_payload = [{**d, "scenario_id": scenario_id} for d in dialogues]
            db.from_(TABLE_DIALOGUES).insert(dialogue_payload).execute()
            
        # 4. Trả về data mới nhất kèm dialogues
        # (Để frontend cập nhật ngay lập tức mà không cần reload)
        updated_scenario['dialogues'] = dialogues
        return updated_scenario

    except Exception as e:
        print(f"DB Error (update_scenario): {e}")
        return None