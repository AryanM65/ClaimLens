import re


def deduplicate_text(lines: list[str]) -> str:
    """
    Removes duplicate OCR lines and strips noise.
    Returns a single clean text block.
    """
    seen = set()
    clean = []
    for line in lines:
        normalized = line.strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            clean.append(normalized)
    return "\n".join(clean)


def normalize_score(val) -> int:
    """Clamps a score value to the 0-100 integer range."""
    try:
        return max(0, min(100, int(val)))
    except (TypeError, ValueError):
        return 0


def clean_json_response(text: str) -> str:
    """
    Strips markdown code fences from a Gemini response so it can be
    passed directly to json.loads().

    Gemini sometimes wraps JSON in ```json ... ``` or ``` ... ``` blocks.
    This function removes those wrappers to get raw JSON.
    """
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()
