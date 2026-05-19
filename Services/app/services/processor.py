import asyncio
import os


async def _extract_audio(video_path: str, audio_path: str):
    """
    Extracts audio using ffmpeg, resampled to 16kHz mono.

    16kHz mono is required by Sarvam AI Saaras v3 for optimal
    transcription quality. Fails silently if no audio stream exists.
    """
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-ar", "16000",   # resample to 16kHz — Sarvam requirement
        "-ac", "1",       # mono channel
        "-q:a", "0",
        "-map", "a",
        audio_path,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()


async def _extract_frames(video_path: str, frames_pattern: str):
    """
    Extracts 1fps frames at 520px wide using ffmpeg.

    520px wide keeps file sizes small. OCR quality is preserved by the
    2x OpenCV upscale that happens inside ocr.py before Tesseract.
    The unsharp filter sharpens text edges before saving.
    """
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", "fps=1,scale=520:-1,unsharp=5:5:1.5",
        frames_pattern,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(
            f"ffmpeg frame extraction failed: {stderr.decode('utf-8', errors='replace')}"
        )


async def extract_audio_and_frames(
    video_path: str, job_dir: str
) -> tuple[str | None, str]:
    """
    Uses ffmpeg to extract audio and 1fps frames from the video concurrently.

    Audio is resampled to 16kHz mono for Sarvam AI compatibility.
    Frames are scaled to 520px wide — imagehash deduplication and
    OpenCV 2x upscale happen in subsequent pipeline steps.

    Args:
        video_path: Path to the downloaded video file.
        job_dir:    The temp directory for this job.

    Returns:
        Tuple of (audio_path, frames_dir):
          - audio_path: path to audio_16k.mp3 (None if no audio stream)
          - frames_dir: path to directory containing frame_0001.jpg, etc.
    """
    audio_path = os.path.join(job_dir, "audio_16k.mp3")
    frames_dir = os.path.join(job_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    frames_pattern = os.path.join(frames_dir, "frame_%04d.jpg")

    await asyncio.gather(
        _extract_audio(video_path, audio_path),
        _extract_frames(video_path, frames_pattern),
    )

    if not os.path.exists(audio_path):
        audio_path = None

    return audio_path, frames_dir
