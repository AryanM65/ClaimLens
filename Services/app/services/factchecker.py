import asyncio
import os
import json
import time
import requests
from google import genai
from dotenv import load_dotenv
from app.utils.helpers import clean_json_response, generate_content_with_retry

load_dotenv()

_client = None
_MODEL  = "gemini-2.5-flash"

def _get_client():
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("GEMINI_API_KEY environment variable is missing or empty.")
        _client = genai.Client(api_key=key)
    return _client

_SERPER_KEY = os.getenv("SERPER_API_KEY")
_SERPER_URL = "https://google.serper.dev/search"

# Max 3 concurrent Serper searches to avoid rate limits
_SEMAPHORE = asyncio.Semaphore(3)


def _make_search_query(claim: str) -> str:
    """
    Uses Gemini to convert a claim into an optimal Google search query.
    Retries automatically on 429 rate limit errors using helper wrapper.
    """
    prompt = f"""Convert this advertisement claim into a short, effective Google search query
that would help fact-check whether the claim is true or false.

Claim: "{claim}"

Return ONLY the search query string. No explanation, no quotes, no punctuation at the end."""

    try:
        response = generate_content_with_retry(_get_client(), _MODEL, prompt)
        query = response.text.strip().strip('"').strip("'")
        return query if query else claim
    except Exception as e:
        print(f"[_make_search_query ERROR] {type(e).__name__}: {e}")
        return claim


async def _search_claim(claim: str) -> list[str]:
    """
    Searches a claim via Serper.dev and returns top 3 result snippets.
    Uses a Gemini-optimised search query instead of the raw claim text.
    Rate-limited via semaphore to max 3 concurrent requests.
    """
    async with _SEMAPHORE:
        query = await asyncio.get_event_loop().run_in_executor(
            None, _make_search_query, claim
        )
        headers = {
            "X-API-KEY": _SERPER_KEY,
            "Content-Type": "application/json",
        }
        payload = {"q": query, "num": 3}
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    _SERPER_URL, headers=headers, json=payload, timeout=10
                ),
            )
            results = response.json().get("organic", [])
            snippets = [r.get("snippet", "") for r in results[:3] if r.get("snippet")]
            # Return both the query used and the snippets for transparency
            return snippets, query
        except Exception:
            return [], claim



async def _label_claim(claim: str, snippets: list[str]) -> dict:
    """
    Sends a claim + search snippets to Gemini 2.5 Flash and returns a
    labelled verdict.

    Labels:
      Verified     — supported by search evidence
      Misleading   — partially true but deceptively framed
      Unverifiable — no evidence found either way
      False        — contradicted by search evidence

    Returns:
        {"claim": str, "status": str, "evidence": str}
    """
    snippets_text = (
        "\n".join(f"- {s}" for s in snippets)
        if snippets
        else "(no search results found)"
    )

    prompt = f"""You are a fact-checker reviewing an advertisement claim.

Claim: "{claim}"

Search results:
{snippets_text}

Label this claim as exactly one of:
- Verified: the claim is supported by the search evidence
- Misleading: the claim is partially true but presented deceptively
- Unverifiable: there is no evidence to confirm or deny this claim
- False: the claim is contradicted by the search evidence

Return ONLY valid JSON in this exact shape:
{{"status": "<Verified|Misleading|Unverifiable|False>", "evidence": "<one sentence explanation>"}}"""

    for attempt in range(3):
        try:
            response = generate_content_with_retry(_get_client(), _MODEL, prompt)
            result = json.loads(clean_json_response(response.text))
            return {
                "claim":    claim,
                "status":   result.get("status", "Unverifiable"),
                "evidence": str(result.get("evidence", "")),
            }
        except Exception as e:
            print(f"[_label_claim attempt {attempt+1}] {type(e).__name__}: {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)
    return {"claim": claim, "status": "Unverifiable", "evidence": "Could not verify after retries."}


async def verify_claims(claims: list[dict]) -> list[dict]:
    """
    Fact-checks every extracted claim using Serper.dev + Gemini 2.5 Flash.

    Each claim is:
      1. Searched on Google via Serper (top 3 snippets)
      2. Labelled by Gemini based on the snippets

    Uses a Semaphore of 1 to run claims sequentially. This prevents spamming
    the Gemini free-tier with concurrent requests and hitting 429 rate limits.

    Args:
        claims: List of {"claim": str, "category": str} from analyser.extract_claims()

    Returns:
        List of {"claim": str, "status": str, "evidence": str}
    """
    if not claims:
        return []

    # Process claims sequentially to respect the Gemini API rate limit
    gemini_sem = asyncio.Semaphore(1)

    async def process_one(c: dict) -> dict:
        async with gemini_sem:
            snippets, query = await _search_claim(c["claim"])
            result = await _label_claim(c["claim"], snippets)
            result["category"]     = c.get("category", "other")
            result["search_query"] = query      # store what was actually searched
            result["snippets"]     = snippets   # store raw Serper snippets
            return result

    return list(await asyncio.gather(*[process_one(c) for c in claims]))
