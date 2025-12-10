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
    
def build_topic_generation_prompt(topic_name: str, user_level) -> str:
    return f"""
You are an English teacher specialized in CEFR methodology. 
    The student's current proficiency level is **{user_level}**.
    Your task is to generate exactly 20 essential English words or phrases for the topic: "{topic_name}".
    CRUCIAL RULE: Apply the i+1 principle. The vocabulary must be designed to slightly challenge the student, meaning the level of the generated words must be approximately **ONE STEP ABOVE** their current level ({user_level}).
    For each word, provide:
    1. The word/phrase.
    2. Part of speech (noun, verb, adjective, etc.).
    3. A clear definition in English.
    4. A natural example sentence using that word.

    Return the result strictly in JSON format as a list of objects:
    [
      {{ "word": "string", "type": "string", "meaning": "string", "context": "string" }}
    ]
    """