import asyncio
import os
import subprocess
import tempfile
from sarvamai import SarvamAI
from dotenv import load_dotenv

load_dotenv()

# Sarvam AI client — initialised once at module level
_client = SarvamAI(api_subscription_key=os.getenv("SARVAM_API_KEY"))

# Sarvam sync API limit is 30s. We use 25s chunks to stay safely under.
_CHUNK_DURATION_SECONDS = 25

# Language code normalisation map
_LANG_MAP = {
    "hi":    "hi",
    "hi-in": "hi",
    "en":    "en",
    "en-in": "en",
    "en-us": "en",
    "en-gb": "en",
}


def _normalise_lang(code: str) -> str:
    """Maps Sarvam language codes to our internal codes (en|hi|hinglish)."""
    return _LANG_MAP.get((code or "").lower(), "hinglish")


def _get_audio_duration(audio_path: str) -> float:
    """Uses ffprobe to get audio duration in seconds."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                audio_path,
            ],
            capture_output=True, text=True, timeout=10,
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0


def _split_audio_into_chunks(audio_path: str, chunk_dir: str) -> list[str]:
    """
    Splits audio into _CHUNK_DURATION_SECONDS chunks using ffmpeg segment.
    Uses libmp3lame re-encoding (not stream copy) so each chunk starts at
    a valid MP3 frame boundary — avoids 'Invalid audio file' from Sarvam.
    Returns list of chunk file paths (min 2KB) in chronological order.
    """
    chunk_pattern = os.path.join(chunk_dir, "chunk_%03d.mp3")
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", audio_path,
            "-f", "segment",
            "-segment_time", str(_CHUNK_DURATION_SECONDS),
            "-c:a", "libmp3lame",   # re-encode — ensures valid MP3 frame start per chunk
            "-ar", "16000",          # keep 16kHz
            "-ac", "1",              # keep mono
            chunk_pattern,
        ],
        capture_output=True, timeout=120,
    )
    return sorted([
        os.path.join(chunk_dir, f)
        for f in os.listdir(chunk_dir)
        if f.startswith("chunk_") and f.endswith(".mp3")
        and os.path.getsize(os.path.join(chunk_dir, f)) > 2048  # skip empty/corrupt chunks
    ])


def _transcribe_chunk_sync(chunk_path: str) -> dict:
    """
    Transcribes a single audio chunk (<=25s) via Sarvam AI sync API.
    Returns {"text": str, "language_code": str}.
    Returns empty result on error so one bad chunk doesn't crash the pipeline.
    """
    try:
        with open(chunk_path, "rb") as f:
            response = _client.speech_to_text.transcribe(
                file=f,
                model="saaras:v3",
                language_code="unknown",
                mode="transcribe",
            )
        return {
            "text":          getattr(response, "transcript", "") or "",
            "language_code": getattr(response, "language_code", "unknown") or "unknown",
        }
    except Exception:
        return {"text": "", "language_code": "unknown"}


async def transcribe(audio_path: str) -> dict:
    """
    Transcribes the audio file using Sarvam AI Saaras v3.

    For audio over 25 seconds, splits into chunks and transcribes in parallel.
    Sarvam's sync API has a 30-second limit — 25s chunks stay safely under it.
    All chunks are submitted concurrently via asyncio thread pool.

    Args:
        audio_path: Path to audio_16k.mp3 (16kHz mono — Sarvam requirement)

    Returns:
        { "text": "English transcript", "language": "en|hi|hinglish|unknown" }
        Returns empty text if audio is silent or music-only.
    """
    if not audio_path or not os.path.exists(audio_path):
        return {"text": "", "language": "unknown"}

    loop = asyncio.get_event_loop()

    duration = await loop.run_in_executor(None, _get_audio_duration, audio_path)

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as chunk_dir:
        if duration <= _CHUNK_DURATION_SECONDS:
            # Short audio — single direct call
            result = await loop.run_in_executor(
                None, _transcribe_chunk_sync, audio_path
            )
            chunks_data = [result]
        else:
            # Long audio — split into chunks and transcribe in parallel
            chunk_paths = await loop.run_in_executor(
                None, _split_audio_into_chunks, audio_path, chunk_dir
            )
            if not chunk_paths:
                return {"text": "", "language": "unknown"}

            tasks = [
                loop.run_in_executor(None, _transcribe_chunk_sync, path)
                for path in chunk_paths
            ]
            chunks_data = await asyncio.gather(*tasks)

    # Combine all chunk transcripts in order
    full_transcript = " ".join(
        d["text"].strip() for d in chunks_data if d.get("text", "").strip()
    )

    # Use the language from the first non-unknown chunk
    detected_lang = "unknown"
    for d in chunks_data:
        lang = d.get("language_code", "unknown")
        if lang and lang.lower() != "unknown":
            detected_lang = lang
            break

    return {
        "text":     full_transcript,
        "language": _normalise_lang(detected_lang),
    }
