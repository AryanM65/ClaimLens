import asyncio
import base64
import json
import os
import sys

# Hard cap — reject any video longer than 3 minutes before downloading
_MAX_DURATION_SECONDS = 180


def _get_cookies_arg(job_dir: str) -> list[str]:
    """
    Decodes the YT_COOKIES_BASE64 environment variable (if present)
    and writes it to a temporary cookies.txt file inside the job_dir.
    Returns the yt-dlp argument list ['--cookies', temp_file_path]
    or an empty list if the variable is not set.
    """
    cookies_base64 = os.getenv("YT_COOKIES_BASE64")
    if not cookies_base64:
        return []

    try:
        # Decode the Base64 cookies string
        cookies_bytes = base64.b64decode(cookies_base64.strip())
        cookies_content = cookies_bytes.decode("utf-8", errors="ignore")

        # Write to job_dir/cookies.txt
        cookies_path = os.path.join(job_dir, "cookies.txt")
        with open(cookies_path, "w", encoding="utf-8") as f:
            f.write(cookies_content)

        print(f"[downloader] Securely decoded YT_COOKIES_BASE64 and wrote to {cookies_path}")
        return ["--cookies", cookies_path]
    except Exception as e:
        print(f"[downloader] WARNING: Failed to decode or write YT_COOKIES_BASE64: {e}")
        return []


async def _get_duration(url: str, job_dir: str = None) -> float:
    """
    Runs yt-dlp --dump-json to fetch video metadata without downloading.
    Returns the video duration in seconds (0 if unknown).
    """
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--js-runtimes", "node",
        "--remote-components", "ejs:github",
    ]

    # Dynamically inject cookies if job_dir is provided
    if job_dir:
        cookies_arg = _get_cookies_arg(job_dir)
        if cookies_arg:
            cmd.extend(cookies_arg)

    cmd.extend([
        "--dump-json",
        "--no-download",
        "--quiet",
        url,
    ])

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
    duration = await _get_duration(url, job_dir)
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
    ]

    # Dynamically inject cookies argument
    cookies_arg = _get_cookies_arg(job_dir)
    if cookies_arg:
        cmd.extend(cookies_arg)

    cmd.extend([
        "--format", "bestvideo[height<=480]+bestaudio/best[height<=480]/best",
        "--output", output_template,
        url,
    ])

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

