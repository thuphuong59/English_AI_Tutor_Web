import json
from typing import List

def get_vocabulary_context_prompt(transcript: str, target_words: List[str]) -> str:
    return f"""
    You are an expert English Vocabulary Coach.
    
    **Transcript:**
    {transcript}

    **Target Suggestions:** {json.dumps(target_words)}

    **TASK:**
    These words were suggested to the student to improve their vocabulary.
    Since they didn't use them, create a **natural, hypothetical example sentence** for each word that fits perfectly into the context of the conversation above.

    **OUTPUT JSON ONLY:**
    [
      {{ "word": "string", "meaning": "string (brief definition)", "context": "string (the example sentence)" }}
    ]
    """
def build_vocab_enrichment_prompt(transcript_text: str, candidates: List[str]) -> str:
    """
    Tạo prompt cho Gemini để phân tích từ vựng, lấy loại từ (type), nghĩa và ngữ cảnh.
    """
    
    # Chuyển list thành chuỗi JSON cho prompt dễ hiểu
    candidates_json = json.dumps(candidates, ensure_ascii=False)

    return f"""
    You are an expert English Vocabulary Coach.

    **Transcript:**
    {transcript_text}

    **Target Suggestions:** {candidates_json}

    **TASK:**
    For each word in 'Target Suggestions', generate a JSON object containing:
    1. **word**: The word itself.
    2. **type**: The part of speech (e.g., noun, verb, adjective, idiom, phrasal verb).
    3. **meaning**: A brief, clear definition relevant to the topic.
    4. **context**: Create a **natural, hypothetical example sentence** using this word that fits the transcript context.

    **OUTPUT JSON ONLY:**
    [
      {{ "word": "string", "type": "string", "meaning": "string", "context": "string" }}
    ]
    """