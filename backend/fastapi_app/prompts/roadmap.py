def build_roadmap_prompt(
    mcq_analysis,
    weak_points_list,
    speaking_transcript,
    prefs_dict,
):
    return f"""
You are an expert in designing personalized English communication learning roadmaps.
You MUST return exactly one valid JSON, with no additional content outside the JSON.

Learner information:
    Quiz result: {mcq_analysis}

    Key weaknesses: {", ".join(weak_points_list) if weak_points_list else "Not clearly identified"}

    Sample speaking transcript: "{speaking_transcript}"

    Daily learning commitment: {prefs_dict['daily_commitment']}

    Communication goal: {prefs_dict['communication_goal']}

    Target time to reach goal: {prefs_dict['target_duration']}

    Strict requirements:

    Analyze the MCQ result ({mcq_analysis}), speaking skills ({speaking_transcript}), and response latency to self-evaluate the learner’s current level (e.g., A1, A2, B1...).

    Write an overall summary (150–250 words) in Vietnamese for the "user_summary" key.

    Create a detailed learning roadmap tailored to the learner’s level and weaknesses, divided into 2–4 phases.

    Each phase MUST contain a "weeks" array.

    In each week, the "grammar", "vocabulary", and "speaking" keys MUST be complex objects containing a "title", "lesson_id", and a detailed "items" array (at least 2 items).

    RETURN ONLY ONE JSON FOLLOWING EXACTLY THIS STRUCTURE:

    {{
    "user_summary": "General overview in English (50-100 words)...",
    "estimated_level": "Example: Pre-Intermediate (A2)",  <-- AI MUST FILL IN
    "roadmap": {{
        "summary": "A short 1–2 sentence summary of the roadmap",
        "current_status": "Goal: {prefs_dict['communication_goal']} • Desired time: {prefs_dict['target_duration']}",
        "daily_plan_recommendation": "Recommended daily study: {prefs_dict['daily_commitment']}, focusing on speaking + vocabulary",
        "learning_phases": [
        {{
            "phase_name": "Phase 1: Building the foundation",
            "duration_weeks": 4,
            "weeks": [
            {{
                "week_number": 1,
                "grammar": {{
                    "title": "Present Simple & Present Continuous (review, usage, structure)",
                    "lesson_id": "P1_W1_Grammar",
                    "items": [
                        {{"title": "Present Simple grammar", "lesson_id": "P1_W1_G_Theory1"}},
                        {{"title": "Present Continuous grammar", "lesson_id": "P1_W1_G_Theory2"}},
                    ]
                }},
                "vocabulary": {{
                    "title": "Daily routines, family, hobbies",
                    "lesson_id": "P1_W1_Vocab",
                    "items": [
                        {{"title": "Daily routine vocabulary (10 words)", "lesson_id": "P1_W1_V_Theory1"}},
                        {{"title": "Family vocabulary (20 words)", "lesson_id": "P1_W1_V_Theory2"}},
                        {{"title": "Hobbies (25 words)", "lesson_id": "P1_W1_V_Theory3"}},

                    ]
                }},
                "speaking": {{
                    "title": "Introduce yourself & talk about a typical day (1–2 minutes)",
                    "lesson_id": "P1_W1_Speaking",
                    "items": [
                        {{"title": "Dialogue: Self-introduction", "lesson_id": "P1_W1_S_conversation1"}},
			            {{"title": "Dialogue: Your daily routine", "lesson_id": "P1_W1_S_conversation2"}},
                    ]
                }},
                "expected_outcome": "Speak basic sentences fluently about yourself and your daily routine"
            }},
            {{
                "week_number": 2,
                "grammar": {{
                    "title": "Imperative sentences & Statements",
                    "lesson_id": "P1_W2_Grammar",
                    "items": [
                        {{"title": "Imperative sentences", "lesson_id": "P1_W2_G_Theory1"}},
                        {{"title": "Statements", "lesson_id": "P1_W2_G_Theory2"}},
                    ]
                }},
                "vocabulary": {{
                    "title": "Travel & Food",
                    "lesson_id": "P1_W2_Vocab",
                    "items": [
                        {{"title": "Travel vocabulary", "lesson_id": "P1_W2_V_Theory1"}},
                        {{"title": "Food vocabulary", "lesson_id": "P1_W2_V_Theory2"}}
                    ]
                }},
                "speaking": {{
                    "title": "Describe a recent travel experience (2 minutes)",
                    "lesson_id": "P1_W2_Speaking",
                    "items": [
                        {{"title": "Dialogue: Describing a travel experience", "lesson_id": "P1_W1_S_conversation1"}},
                    ]
                }},
                "expected_outcome": "Tell a past story using clear time markers"
            }}
            ]
        }}
        ]
    }}
    }}

    IMPORTANT:

    The total number of weeks across all phases must be reasonable based on the target duration ({prefs_dict['target_duration']}).

    Focus on addressing weaknesses: {", ".join(weak_points_list) if weak_points_list else "balancing all skills"}.

    Speaking tasks must be practical and recordable.

    Expected outcomes must be measurable (speaking duration, number of errors, fluency level...).
    All text values in the returned JSON MUST be written in English only.
    Do NOT use Vietnamese or any other language.
    Start immediately with the JSON, no additional text.
    """