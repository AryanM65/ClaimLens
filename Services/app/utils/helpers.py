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


def generate_content_with_retry(client, model: str, contents, max_retries: int = 5):
    """
    Wrapper for Gemini's generate_content that automatically catches 429 Resource Exhausted
    rate limits, sleeps for a cooldown window, and retries.
    """
    import time
    delay = 10.0
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(model=model, contents=contents)
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                print(f"\n⚠️ [Gemini Rate Limit] 429 Resource Exhausted. Sleeping {delay}s before retry... (Attempt {attempt+1}/{max_retries})")
                time.sleep(delay)
                delay += 5.0  # Scale retry delay
            else:
                # Re-raise standard/developer errors (invalid parameters, etc.)
                raise e

    # Final attempt
    return client.models.generate_content(model=model, contents=contents)
