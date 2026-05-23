import os
import json
import time
import base64
from google import genai
from dotenv import load_dotenv
from app.utils.helpers import normalize_score, clean_json_response, generate_content_with_retry

load_dotenv()

_client = None
_MODEL  = "gemini-2.0-flash"

def _get_client():
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("GEMINI_API_KEY environment variable is missing or empty.")
        _client = genai.Client(api_key=key)
    return _client

# Number of frames to evenly sample for Gemini visual analysis
_GEMINI_FRAME_COUNT = 12


def _get_sorted_frames(frames_dir: str) -> list[str]:
    """Returns all JPEG frame paths from a directory, sorted chronologically."""
    if not frames_dir or not os.path.exists(frames_dir):
        return []
    return sorted([
        os.path.join(frames_dir, f)
        for f in os.listdir(frames_dir)
        if f.lower().endswith(".jpg")
    ])


def _sample_frames(frame_paths: list[str], n: int = _GEMINI_FRAME_COUNT) -> list[str]:
    """
    Evenly samples n frames from the full frame list.
    Returns all frames if fewer than n exist.
    """
    if len(frame_paths) <= n:
        return frame_paths
    step = len(frame_paths) // n
    return [frame_paths[i * step] for i in range(n)]


async def visual_analysis(frames_dir: str, transcript: str = "") -> list[dict]:
    """
    Gemini Call 1 — sends up to 12 evenly sampled frames + audio transcript
    for visual credibility analysis.

    The transcript gives Gemini context on what the ad CLAIMS so it can
    cross-reference against what is actually SHOWN visually.

    Args:
        frames_dir: Directory containing all extracted frame JPEGs.
        transcript: Audio transcript from Sarvam AI (native language).

    Returns:
        List of visual flags: [{"issue": str, "description": str}]
        Returns empty list if no visual credibility issues are found.
    """
    all_frames = _get_sorted_frames(frames_dir)
    sampled    = _sample_frames(all_frames)

    if not sampled:
        return []

    # Build inline image parts for Gemini
    image_parts = []
    for path in sampled:
        try:
            with open(path, "rb") as f:
                data = base64.b64encode(f.read()).decode("utf-8")
            image_parts.append({"mime_type": "image/jpeg", "data": data})
        except Exception:
            continue

    if not image_parts:
        return []

    prompt = f"""You are a consumer protection analyst reviewing an advertisement.
Your job is to protect everyday viewers by identifying anything visually misleading or deceptive.

WHAT THE AD CLAIMS (audio transcript):
{transcript or "(no audio available)"}

Now examine the video frames carefully. Identify any visual techniques that could mislead viewers about
how effective the product actually is, what real results look like, or whether what is shown could
happen in real life. Think like a sceptical viewer.

Consider: exaggerated transformations, animations presented as real, lighting or makeup tricks that
exaggerate results, demonstrations that seem too fast or dramatic, visuals that contradict or
exaggerate the spoken claims, fine-print disclaimers shown while bold visuals make opposite claims,
and any other technique designed to make the product appear more effective than it really is.

Return a JSON array of issues found. Each item must have:
- "issue": a short label describing the visual trick
- "description": one clear sentence explaining what a viewer is being misled about

If the ad is visually honest, return an empty array: []

Return ONLY the JSON array. No explanation, no markdown, no code block."""

    contents = [prompt] + [{"inline_data": part} for part in image_parts]

    try:
        response = _client.models.generate_content(model=_MODEL, contents=contents)
        flags = json.loads(clean_json_response(response.text))
        if not isinstance(flags, list):
            return []
        return [
            {"issue": str(f.get("issue", "")), "description": str(f.get("description", ""))}
            for f in flags if f.get("issue")
        ]
    except Exception:
        return []


async def extract_claims(transcript: str, ocr_text: str) -> list[dict]:
    """
    Gemini Call 2 — extracts every factual claim from the ad content.

    Since Sarvam AI Saaras v3 uses mode='transcribe', the text is in its
    original language. Gemini handles Hindi, English, and Hinglish natively.

    Args:
        transcript: Transcript from Sarvam AI (native language).
        ocr_text:   Combined deduplicated on-screen text from Tesseract OCR.

    Returns:
        List of dicts: [{"claim": str, "category": str}]
        Returns empty list if no factual claims are found.
    """
    if not transcript and not ocr_text:
        return []

    prompt = f"""You are an expert advertisement claim extractor.

Extract every factual claim from this advertisement content.

TRANSCRIPT:
{transcript or "(no audio)"}

ON-SCREEN TEXT (OCR):
{ocr_text or "(no text)"}

A factual claim is any statement that makes a specific, verifiable assertion
about the product or service — not an opinion or slogan.

Categories: health, statistical, comparative, endorsement, pricing, guarantee, other

Return a JSON array. Each item must have:
- "claim": the exact claim (in English if possible)
- "category": one of the categories above

If no factual claims are found, return an empty array: []

Return ONLY the JSON array. No explanation, no markdown, no code block."""

    try:
        response = _client.models.generate_content(model=_MODEL, contents=prompt)
        claims = json.loads(clean_json_response(response.text))
        if not isinstance(claims, list):
            return []
        return [
            {"claim": str(c.get("claim", "")), "category": str(c.get("category", "other"))}
            for c in claims if c.get("claim")
        ]
    except Exception as e:
        print(f"[extract_claims ERROR] {type(e).__name__}: {e}")
        return []


async def score_report(
    transcript: str,
    ocr_text: str,
    verified_claims: list[dict],
    visual_flags: list[dict],
    language: str,
) -> dict:
    """
    Gemini Call 3 — produces the final credibility scores and plain-English verdict.

    Combines all pipeline evidence:
      - Audio transcript (native language, from Sarvam)
      - OCR on-screen text
      - Verified/labelled claims from factchecker
      - Visual flags from visual_analysis

    Returns:
        Dict matching PipelineResponse shape with scores, verdict, claims, flags.
    """
    claims_text = json.dumps(verified_claims, indent=2) if verified_claims else "None extracted."
    flags_text  = json.dumps(visual_flags,  indent=2)  if visual_flags  else "None detected."

    prompt = f"""You are an expert advertisement credibility analyst.

Analyse the following advertisement evidence and produce a final credibility report.

TRANSCRIPT:
{transcript or "(no audio)"}

ON-SCREEN TEXT (OCR):
{ocr_text or "(no text)"}

FACT-CHECKED CLAIMS:
{claims_text}

VISUAL FLAGS:
{flags_text}

LANGUAGE DETECTED: {language}

Score this advertisement:
- overall_score (0-100): overall credibility combining all evidence
- audio_score (0-100): credibility of spoken claims
- text_score (0-100): credibility of on-screen text claims
(100 = fully credible, 0 = completely misleading)

Write a plain English verdict (2-3 sentences) summarising the key credibility
issues for a general audience.

Return ONLY valid JSON in this exact shape:
{{
  "overall_score": <int>,
  "audio_score": <int>,
  "text_score": <int>,
  "verdict": "<string>",
  "language_detected": "<en|hi|hinglish|unknown>"
}}"""

    for attempt in range(3):
        try:
            response = generate_content_with_retry(_get_client(), _MODEL, prompt)
            result   = json.loads(clean_json_response(response.text))
            return {
                "overall_score":     normalize_score(result.get("overall_score", 50)),
                "audio_score":       normalize_score(result.get("audio_score", 50)),
                "text_score":        normalize_score(result.get("text_score", 50)),
                "verdict":           str(result.get("verdict", "")),
                "flagged_claims":    verified_claims,
                "visual_flags":      visual_flags,
                "language_detected": result.get("language_detected", language),
            }
        except Exception as e:
            print(f"[score_report attempt {attempt+1}] {type(e).__name__}: {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)

    # Fallback if all retries fail
    return {
        "overall_score":     50,
        "audio_score":       50,
        "text_score":        50,
        "verdict":           "Could not generate a credibility report due to a service error.",
        "flagged_claims":    verified_claims,
        "visual_flags":      visual_flags,
        "language_detected": language,
    }
