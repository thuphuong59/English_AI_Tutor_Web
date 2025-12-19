def build_quiz_test_prompt(
    comm_goal,
    barrier,
    commitment,
    target_duration,
):
    return f"""
        SYSTEM ROLE: Senior English Assessment Developer.
        TASK: Generate a diagnostic test JSON based on the learner profile below.

        LEARNER PROFILE:
        - Goal: {comm_goal}
        - Barrier: {barrier}
        - Commitment: {commitment}/day
        - Target: {target_duration}

        STRICT TEST STRUCTURE (Total 21 Questions):
        - ID 1-10: Grammar (Focus on practical structures for "{comm_goal}")
        - ID 11-20: Vocabulary (Situational terms for "{comm_goal}" and "{barrier}")
        - ID 21: Speaking Prompts (Open-ended situational scenarios) about "{comm_goal}"

        JSON SCHEMA REQUIREMENTS:
        Return a single JSON object: {{"questions": [...]}}
        Each item MUST have:
        - "id": (int) strict sequence from 1 to 21.
        - "question_text": (string) in English.
        - "options": 
            * For MCQ (ID 1-20): Array of exactly 4 strings. NO prefixes like "A)", "B)", etc.
            * For Speaking (ID 21): Empty array [].
        - "correct_answer_key":
            * For MCQ: Exactly one character "A", "B", "C", or "D".
            * For Speaking: Exactly "N/A".
        - "question_type": "grammar", "vocabulary", or "speaking_prompt".

        OUTPUT CONSTRAINT:
        Return ONLY RAW JSON. No markdown blocks, no preamble, no conversational filler.
        Ensure logically plausible distractors for MCQs.
        """