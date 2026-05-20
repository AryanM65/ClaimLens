import asyncio
import os
import cv2
import pytesseract
from PIL import Image
from app.utils.helpers import deduplicate_text

# Tesseract config:
# --oem 3  = Use the best available OCR engine (LSTM + legacy)
# --psm 3  = Auto page segmentation — better for mixed-layout ad frames
# lang     = English + Hindi (Devanagari)
_TESS_LANG   = "eng+hin"
_TESS_CONFIG = "--oem 3 --psm 3"

# Explicitly point pytesseract to the Tesseract binary.
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Max concurrent OCR tasks at one time.
_OCR_CONCURRENCY = 4

# Minimum Tesseract confidence score (0-100) to accept a word.
# Raised to 75 to reduce hallucinations from visual noise (textures,
# highlights, product surfaces being misread as characters).
_CONF_THRESHOLD = 75


def _ocr_single_frame(frame_path: str) -> list[str]:
    """
    Runs Tesseract OCR on a single frame file.

    OpenCV pre-processing pipeline applied before Tesseract:
      1. Read as BGR with OpenCV
      2. Convert to grayscale — single-channel optimised for Tesseract LSTM
      3. Binary threshold (150/255) — separates text from background
      4. 2x upscale with LANCZOS — doubles pixel density so small text
         (disclaimers, Devanagari strokes) meets Tesseract's minimum
         character-height threshold for reliable recognition

    Uses image_to_data() to get per-word confidence scores. Words below
    _CONF_THRESHOLD are discarded — removes hallucinated characters from
    blurry backgrounds, gradients, bokeh, and UI decorations.

    Returns a list of non-empty text lines found in the frame.
    """
    img_bgr = cv2.imread(frame_path)
    if img_bgr is None:
        return []

    # Grayscale
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Binary threshold
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    # 2x upscale
    scaled = cv2.resize(thresh, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)

    img = Image.fromarray(scaled)

    data = pytesseract.image_to_data(
        img,
        lang=_TESS_LANG,
        config=_TESS_CONFIG,
        output_type=pytesseract.Output.DICT,
    )

    # Group high-confidence words back into their original lines
    lines: dict[tuple, list[str]] = {}
    for i, word in enumerate(data["text"]):
        conf = int(data["conf"][i])
        word = word.strip()
        if not word or conf < _CONF_THRESHOLD:
            continue
        line_key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(line_key, []).append(word)

    return [" ".join(words) for words in lines.values() if words]


async def extract_text_from_frames(frames_dir: str) -> str:
    """
    Runs Tesseract OCR on all frames in frames_dir concurrently.

    Each frame is submitted individually to the default thread-pool executor,
    with up to _OCR_CONCURRENCY frames running at the same time.

    Args:
        frames_dir: Path to the directory containing frame JPEGs.

    Returns:
        Deduplicated combined text block from all frames (in chronological order).
    """
    if not frames_dir or not os.path.exists(frames_dir):
        return ""

    frame_paths = sorted([
        os.path.join(frames_dir, f)
        for f in os.listdir(frames_dir)
        if f.lower().endswith((".jpg", ".jpeg"))
    ])

    if not frame_paths:
        return ""

    loop = asyncio.get_event_loop()
    all_lines: list[str] = []

    for i in range(0, len(frame_paths), _OCR_CONCURRENCY):
        batch = frame_paths[i: i + _OCR_CONCURRENCY]
        tasks = [loop.run_in_executor(None, _ocr_single_frame, path) for path in batch]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in batch_results:
            if isinstance(result, list):
                all_lines.extend(result)

    return deduplicate_text(all_lines)
