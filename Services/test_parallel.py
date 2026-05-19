import asyncio
import os
import time
from app.services.transcriber import transcribe
from app.services.ocr import extract_text_from_frames, _ocr_single_frame
from app.utils.storage import get_job_dir


async def test():
    job_id = "test_job_125"
    job_dir = get_job_dir(job_id)

    # Sarvam requires the 16kHz resampled audio
    audio_path = os.path.join(job_dir, "audio_16k.mp3")
    frames_dir = os.path.join(job_dir, "frames")

    if not os.path.exists(audio_path):
        print("ERROR: audio_16k.mp3 not found.")
        print("Please run test_processor.py first to re-extract audio at 16kHz.")
        return

    if not os.path.exists(frames_dir):
        print("ERROR: frames/ directory not found.")
        print("Please run test_processor.py first.")
        return

    # Collect sorted frame paths (OCR now takes a list, not a directory)
    frame_paths = sorted([
        os.path.join(frames_dir, f)
        for f in os.listdir(frames_dir)
        if f.lower().endswith(".jpg")
    ])

    if not frame_paths:
        print("ERROR: No frames found in frames/ directory.")
        return

    print(f"Found {len(frame_paths)} frames")
    print(f"Audio: {audio_path} ({os.path.getsize(audio_path):,} bytes)")
    print(f"\nStarting parallel: Sarvam Saaras v3 + Tesseract OCR ({len(frame_paths)} frames)...")
    start_time = time.time()

    # Step 4 — PARALLEL: Sarvam transcription + Tesseract OCR
    transcript_result, combined_ocr = await asyncio.gather(
        transcribe(audio_path),
        extract_text_from_frames(frame_paths),
    )

    duration = time.time() - start_time
    print(f"Finished in {duration:.2f} seconds!")

    # Per-frame OCR for debug output
    loop = asyncio.get_event_loop()
    per_frame_results = []
    for path in frame_paths:
        lines = await loop.run_in_executor(None, _ocr_single_frame, path)
        per_frame_results.append((os.path.basename(path), lines))

    # Write output file
    output_file = os.path.join(job_dir, "extracted_text.txt")
    with open(output_file, "w", encoding="utf-8") as f:

        f.write("=" * 60 + "\n")
        f.write("TRANSCRIPT (SARVAM AI SAARAS V3)\n")
        f.write("=" * 60 + "\n")
        f.write(f"Language detected: {transcript_result.get('language')}\n\n")
        f.write(transcript_result.get("text", "") + "\n\n")

        f.write("=" * 60 + "\n")
        f.write("OCR PER FRAME (TESSERACT + OPENCV)\n")
        f.write("=" * 60 + "\n\n")
        for fname, lines in per_frame_results:
            frame_num = int(fname.replace("frame_", "").replace(".jpg", ""))
            text = " | ".join(lines) if lines else "(no text detected)"
            f.write(f"Frame {frame_num} -> {text}\n")

        f.write("\n" + "=" * 60 + "\n")
        f.write("OCR COMBINED & DEDUPLICATED (sent to Gemini)\n")
        f.write("=" * 60 + "\n\n")
        f.write(combined_ocr + "\n")

    print(f"\nSUCCESS! Output saved to:\n{output_file}")
    print(f"\nTiming breakdown:")
    print(f"  Total (parallel):  {duration:.2f}s for {len(frame_paths)} frames")


if __name__ == "__main__":
    asyncio.run(test())
