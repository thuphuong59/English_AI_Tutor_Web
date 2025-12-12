def build_quiz_prompt(topic_name: str, user_current_level: str) -> str:
    return f"""
    You are an English test generator specializing in CEFR assessment. 
    The student's current proficiency level is **{user_current_level}**.

    Your task is to generate exactly 10 multiple-choice questions (MCQs) for the grammar topic: "{topic_name}".

    CRUCIAL RULE (i+1 Principle): The difficulty of the questions must be designed to slightly challenge the student, meaning the level must be approximately **ONE STEP ABOVE** their current level (e.g., if the student is B1, the test should be B2 difficulty).

For each question, provide:
    1. The question text.
    2. Exactly 4 options (A, B, C, D). The options should be listed as simple strings, without the A., B., C., D. prefixes in the list.
    3. The correct answer **KEY** (A, B, C, or D).

    Return the result strictly in JSON format as a list of objects:
    [
      {{ 
        "question": "string", 
        "options": ["string_A_value", "string_B_value", "string_C_value", "string_D_value"], 
        "answer": "A"  // 🚨 THAY ĐỔI: Sử dụng "correct_key" và yêu cầu là KÝ TỰ (A, B, C, D)
      }}
    ]
    """