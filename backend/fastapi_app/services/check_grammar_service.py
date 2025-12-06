import requests
from typing import List, Dict

import requests
from fastapi import HTTPException
from fastapi_app.schemas.check_grammar_schemas import GrammarRequest, GrammarResponse, GrammarError

def check_grammar_service(req: GrammarRequest) -> GrammarResponse:
    url = "https://api.languagetool.org/v2/check"
    data = {
        "text": req.text,
        "language": "en-US"
    }

    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        result = response.json()
    except requests.RequestException:
        raise HTTPException(status_code=500, detail="Lỗi khi gọi LanguageTool API")

    errors = []
    corrected_text = req.text

    matches = result.get("matches", [])

    for match in matches:
        message = match["message"]
        replacements = match.get("replacements", [])
        suggestions = [r["value"] for r in replacements] if replacements else []
        errors.append(GrammarError(
                        message=message,
                        suggestions=suggestions,
                        offset=match["offset"],
                        length=match["length"]
                    ))

    for match in reversed(matches):
        offset = match["offset"]
        length = match["length"]
        replacements = match.get("replacements", [])
        if replacements:
            suggestion = replacements[0]["value"]
            corrected_text = corrected_text[:offset] + suggestion + corrected_text[offset+length:]

    return GrammarResponse(
        corrected_text=corrected_text,
        count=len(errors),
        errors=errors
    )
