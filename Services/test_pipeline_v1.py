"""
End-to-end test for pipeline Steps 1-5:
  1. Download video (yt-dlp, 480p, 3-min check)
  2. Extract audio (16kHz mono) + frames (1fps, 520px) in parallel
  3+4+5. PARALLEL:
      - Sarvam AI transcription
      - Tesseract OCR (all frames)
      - Gemini visual analysis (12 evenly sampled frames)

Usage:
  python test_pipeline_v1.py <youtube_url> [job_id]

Example:
  python test_pipeline_v1.py https://www.youtube.com/watch?v=CcfZqA_R7Tc
"""

import asyncio
import os
import sys
import time
from app.services.downloader import download
from app.services.processor import extract_audio_and_frames
from app.services.transcriber import transcribe
from app.services.ocr import extract_text_from_frames, _ocr_single_frame
from app.services.analyser import visual_analysis, extract_claims, score_report, _get_sorted_frames, _sample_frames
from app.services.factchecker import verify_claims
from app.utils.storage import get_job_dir


async def run(url: str, job_id: str):
    job_dir = get_job_dir(job_id)
    os.makedirs(job_dir, exist_ok=True)

    print(f"\nJob ID : {job_id}")
    print(f"URL    : {url}")
    print(f"Dir    : {job_dir}\n")

    # Step 1: Download
    print("Step 1 - Downloading video (yt-dlp, max 480p)...")
    t = time.time()
    try:
        video_path = await download(url, job_dir)
    except ValueError as e:
        print(f"  REJECTED: {e}")
        return
    size_mb = os.path.getsize(video_path) / 1_000_000
    print(f"  Done in {time.time()-t:.1f}s - {size_mb:.1f} MB  ({os.path.basename(video_path)})\n")

    # Step 2: Extract audio + frames
    print("Step 2 - Extracting audio (16kHz mono) + frames (1fps, 520px) in parallel...")
    t = time.time()
    audio_path, frames_dir = await extract_audio_and_frames(video_path, job_dir)
    frame_paths = sorted([
        os.path.join(frames_dir, f)
        for f in os.listdir(frames_dir)
        if f.lower().endswith(".jpg")
    ]) if os.path.exists(frames_dir) else []

    audio_kb = os.path.getsize(audio_path) // 1024 if audio_path else 0
    print(f"  Done in {time.time()-t:.1f}s")
    print(f"  Audio : {os.path.basename(audio_path)}  ({audio_kb:,} KB)")
    print(f"  Frames: {len(frame_paths)} frames extracted")

    # Show which 12 frames will be sampled for Gemini
    all_frames = _get_sorted_frames(frames_dir)
    sampled = _sample_frames(all_frames)
    sampled_nums = [int(os.path.basename(p).replace("frame_", "").replace(".jpg", "")) for p in sampled]
    print(f"  Gemini sample ({len(sampled)} frames): {sampled_nums}\n")

    # Steps 3+4+5: PARALLEL - Sarvam + OCR + Gemini visual analysis
    print(f"Step 3+4+5 - PARALLEL:")
    print(f"  - Sarvam Saaras v3 (audio transcription)")
    print(f"  - Tesseract OCR ({len(frame_paths)} frames)")
    print(f"  - Gemini visual analysis ({len(sampled)} sampled frames)")
    t = time.time()

    transcript_result, combined_ocr, visual_flags = await asyncio.gather(
        transcribe(audio_path),
        extract_text_from_frames(frames_dir),
        visual_analysis(frames_dir),
    )

    elapsed = time.time() - t
    print(f"  Done in {elapsed:.2f}s")

    # Step 6 — Gemini Call 2: extract claims from transcript + OCR
    print("\nStep 6 - Gemini Call 2 (claim extraction)...")
    t2 = time.time()
    claims = await extract_claims(
        transcript_result.get("text", ""),
        combined_ocr,
    )
    print(f"  Done in {time.time() - t2:.2f}s — {len(claims)} claims found")

    # Step 7 — Serper search + Gemini fact-checking
    print("\nStep 7 - Serper search + Gemini fact-checking...")
    t3 = time.time()
    verified = await verify_claims(claims)
    print(f"  Done in {time.time() - t3:.2f}s")

    # Step 8 — Gemini Call 3: final credibility score + verdict
    print("\nStep 8 - Gemini Call 3 (credibility score + verdict)...")
    t4 = time.time()
    report = await score_report(
        transcript=transcript_result.get("text", ""),
        ocr_text=combined_ocr,
        verified_claims=verified,
        visual_flags=visual_flags,
        language=transcript_result.get("language", "unknown"),
    )
    print(f"  Done in {time.time() - t4:.2f}s\n")

    # Per-frame OCR for debug output
    loop = asyncio.get_event_loop()
    per_frame = []
    for path in frame_paths:
        lines = await loop.run_in_executor(None, _ocr_single_frame, path)
        per_frame.append((os.path.basename(path), lines))

    # Write full output file
    output_file = os.path.join(job_dir, "extracted_text.txt")
    with open(output_file, "w", encoding="utf-8") as f:

        f.write("=" * 60 + "\n")
        f.write("TRANSCRIPT (SARVAM AI SAARAS V3)\n")
        f.write("=" * 60 + "\n")
        f.write(f"Language detected: {transcript_result.get('language', 'unknown')}\n\n")
        f.write(transcript_result.get("text", "") + "\n\n")

        f.write("=" * 60 + "\n")
        f.write("OCR PER FRAME (TESSERACT + OPENCV)\n")
        f.write("=" * 60 + "\n\n")
        for fname, lines in per_frame:
            frame_num = int(fname.replace("frame_", "").replace(".jpg", ""))
            marker = " [GEMINI]" if frame_num in sampled_nums else ""
            text = " | ".join(lines) if lines else "(no text detected)"
            f.write(f"Frame {frame_num:>3}{marker} -> {text}\n")

        f.write("\n" + "=" * 60 + "\n")
        f.write("OCR COMBINED & DEDUPLICATED (sent to Gemini)\n")
        f.write("=" * 60 + "\n\n")
        f.write(combined_ocr + "\n")

        f.write("\n" + "=" * 60 + "\n")
        f.write("GEMINI VISUAL FLAGS\n")
        f.write("=" * 60 + "\n")
        f.write(f"Frames analysed: {sampled_nums}\n\n")
        if visual_flags:
            for i, flag in enumerate(visual_flags, 1):
                f.write(f"{i}. [{flag.get('issue', '')}]\n")
                f.write(f"   {flag.get('description', '')}\n\n")
        else:
            f.write("No visual credibility issues detected.\n")

        f.write("\n" + "=" * 60 + "\n")
        f.write("GEMINI CALL 2 — EXTRACTED CLAIMS\n")
        f.write("=" * 60 + "\n\n")
        if claims:
            for i, c in enumerate(claims, 1):
                f.write(f"{i}. [{c.get('category', 'other')}]\n")
                f.write(f"   {c.get('claim', '')}\n\n")
        else:
            f.write("No factual claims extracted.\n")

        f.write("\n" + "=" * 60 + "\n")
        f.write("FACT-CHECK RESULTS (SERPER + GEMINI)\n")
        f.write("=" * 60 + "\n\n")
        if verified:
            for r in verified:
                claim    = r.get("claim", "")
                status   = r.get("status", "Unverifiable")
                evidence = r.get("evidence", "")
                query    = r.get("search_query", claim)
                snippets = r.get("snippets", [])

                f.write(f"[{status}]\n")
                f.write(f"Claim         : {claim}\n")
                f.write(f"Search query  : {query}\n")
                f.write(f"Evidence      : {evidence}\n")
                if snippets:
                    f.write("Serper results:\n")
                    for s in snippets:
                        f.write(f"  - {s}\n")
                f.write("\n")
        else:
            f.write("No claims were fact-checked.\n")

        f.write("\n" + "=" * 60 + "\n")
        f.write("GEMINI CALL 3 — FINAL CREDIBILITY REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Overall score  : {report['overall_score']} / 100\n")
        f.write(f"Audio score    : {report['audio_score']} / 100\n")
        f.write(f"Text score     : {report['text_score']} / 100\n")
        f.write(f"Language       : {report['language_detected']}\n\n")
        f.write(f"Verdict:\n{report['verdict']}\n")

        # Full raw JSON — complete machine-readable pipeline output
        f.write("\n" + "=" * 60 + "\n")
        f.write("FULL PIPELINE OUTPUT (JSON)\n")
        f.write("=" * 60 + "\n\n")
        full_output = {
            "job_id":           job_id,
            "url":              url,
            "language_detected": report["language_detected"],
            "scores": {
                "overall": report["overall_score"],
                "audio":   report["audio_score"],
                "text":    report["text_score"],
            },
            "verdict":          report["verdict"],
            "visual_flags":     visual_flags,
            "flagged_claims":   verified,
        }
        import json as _json
        f.write(_json.dumps(full_output, indent=2, ensure_ascii=False) + "\n")

    # Console summary
    print(f"Output saved to:\n  {output_file}\n")
    print("-" * 60)
    print("TRANSCRIPT:")
    safe_text = transcript_result.get("text", "(empty)").encode(
        sys.stdout.encoding or "utf-8", errors="replace"
    ).decode(sys.stdout.encoding or "utf-8", errors="replace")
    print(safe_text)
    print("-" * 60)
    print(f"OCR unique lines : {len(combined_ocr.splitlines())}")
    print(f"Visual flags     : {len(visual_flags)}")
    if visual_flags:
        for flag in visual_flags:
            print(f"  - [{flag.get('issue')}] {flag.get('description')}")
    else:
        print("  No visual issues flagged.")
    print(f"\nExtracted claims : {len(claims)}")
    for c in claims:
        safe_claim = c.get('claim', '').encode(
            sys.stdout.encoding or 'utf-8', errors='replace'
        ).decode(sys.stdout.encoding or 'utf-8', errors='replace')
        print(f"  [{c.get('category')}] {safe_claim}")
    print(f"\nFact-check results : {len(verified)}")
    for r in verified:
        safe_claim = r.get('claim', '').encode(
            sys.stdout.encoding or 'utf-8', errors='replace'
        ).decode(sys.stdout.encoding or 'utf-8', errors='replace')
        safe_ev = r.get('evidence', '').encode(
            sys.stdout.encoding or 'utf-8', errors='replace'
        ).decode(sys.stdout.encoding or 'utf-8', errors='replace')
        print(f"  [{r.get('status')}] {safe_claim}")
        print(f"    -> {safe_ev}")
    print()
    print("=" * 60)
    print("FINAL CREDIBILITY REPORT")
    print("=" * 60)
    print(f"Overall  : {report['overall_score']} / 100")
    print(f"Audio    : {report['audio_score']} / 100")
    print(f"Text     : {report['text_score']} / 100")
    safe_verdict = report['verdict'].encode(
        sys.stdout.encoding or 'utf-8', errors='replace'
    ).decode(sys.stdout.encoding or 'utf-8', errors='replace')
    print(f"Verdict  : {safe_verdict}")
    print(f"\nTotal time (parallel): {elapsed:.2f}s")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_pipeline_v1.py <url> [job_id]")
        sys.exit(1)

    url    = sys.argv[1]
    job_id = sys.argv[2] if len(sys.argv) > 2 else "test_job_126"
    asyncio.run(run(url, job_id))
