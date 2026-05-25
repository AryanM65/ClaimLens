import asyncio
import json
import os
import sys

# Hard cap — reject any video longer than 3 minutes before downloading
_MAX_DURATION_SECONDS = 180


async def _get_duration(url: str) -> float:
    """
    Runs yt-dlp --dump-json to fetch video metadata without downloading.
    Returns the video duration in seconds (0 if unknown).
    """
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--js-runtimes", "node",
        "--remote-components", "ejs:github",
        "--dump-json",
        "--no-download",
        "--quiet",
        url,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    if proc.returncode != 0 or not stdout:
        return 0.0
    try:
        info = json.loads(stdout.decode("utf-8", errors="replace"))
        return float(info.get("duration", 0) or 0)
    except (json.JSONDecodeError, ValueError):
        return 0.0


async def download(url: str, job_dir: str) -> str:
    """
    Downloads the ad video at 480p using yt-dlp.

    Checks video duration first (without downloading). If the video is
    longer than _MAX_DURATION_SECONDS (3 minutes), raises ValueError
    immediately — no bandwidth wasted.

    Args:
        url:     The ad URL (YouTube, Instagram, TikTok, etc.)
        job_dir: The temp directory for this job

    Returns:
        Path to the downloaded video file.

    Raises:
        ValueError  if video exceeds 3-minute limit.
        RuntimeError if yt-dlp download fails.
    """
    # Step 1 — duration check (no download)
    duration = await _get_duration(url)
    if duration > _MAX_DURATION_SECONDS:
        raise ValueError(
            f"Video is {int(duration)}s — ads must be under "
            f"{_MAX_DURATION_SECONDS}s (3 minutes)."
        )

    # Step 2 — download at 480p
    output_template = os.path.join(job_dir, "video.%(ext)s")
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--js-runtimes", "node",
        "--remote-components", "ejs:github",
        "--format", "bestvideo[height<=480]+bestaudio/best[height<=480]/best",
        "--output", output_template,
        url,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(
            f"yt-dlp failed: {stderr.decode('utf-8', errors='replace')}"
        )

    # Find the downloaded file (extension varies by platform)
    for f in os.listdir(job_dir):
        if f.startswith("video."):
            return os.path.join(job_dir, f)

    raise RuntimeError("yt-dlp succeeded but output file not found in job directory")
