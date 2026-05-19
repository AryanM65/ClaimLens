"""
Isolated test for Gemini Call 1 — Visual Analysis.
Runs on already-extracted frames (no download/processing needed).

Usage:
  python test_call1_visual.py [job_id]
"""

import asyncio
import json
import os
import sys
from app.services.analyser import visual_analysis, _get_sorted_frames, _sample_frames
from app.utils.storage import get_job_dir


async def run(job_id: str):
    job_dir    = get_job_dir(job_id)
    frames_dir = os.path.join(job_dir, "frames")
    text_file  = os.path.join(job_dir, "extracted_text.txt")

    if not os.path.exists(frames_dir):
        print(f"ERROR: frames/ not found in {job_dir}")
        print("Run test_pipeline_v1.py first to extract frames.")
        return

    # Load transcript from previous run if available
    transcript = ""
    if os.path.exists(text_file):
        with open(text_file, encoding="utf-8") as f:
            content = f.read()
        # Extract just the transcript section
        if "TRANSCRIPT (SARVAM" in content:
            start = content.index("\n\n", content.index("TRANSCRIPT (SARVAM")) + 2
            end   = content.index("====", start)
            transcript = content[start:end].strip()
        print(f"Transcript loaded ({len(transcript)} chars)")
    else:
        print("No extracted_text.txt found — running without transcript context")

    # Show which frames will be sampled
    all_frames   = _get_sorted_frames(frames_dir)
    sampled      = _sample_frames(all_frames)
    sampled_nums = [
        int(os.path.basename(p).replace("frame_", "").replace(".jpg", ""))
        for p in sampled
    ]

    print(f"\nJob ID     : {job_id}")
    print(f"Total frames available : {len(all_frames)}")
    print(f"Frames sent to Gemini  : {len(sampled)}")
    print(f"Frame numbers          : {sampled_nums}\n")
    print(f"Sending to Gemini Call 1 (visual analysis + transcript context)..."
    )

    import time
    t = time.time()
    flags = await visual_analysis(frames_dir, transcript=transcript)
    elapsed = time.time() - t

    print(f"Done in {elapsed:.2f}s\n")
    print("=" * 60)
    print("GEMINI CALL 1 — VISUAL FLAGS OUTPUT")
    print("=" * 60)

    if not flags:
        print("No visual credibility issues detected.")
    else:
        for i, flag in enumerate(flags, 1):
            print(f"\n{i}. Issue      : {flag.get('issue')}")
            print(f"   Description: {flag.get('description')}")

    print("\n" + "=" * 60)
    print("RAW JSON:")
    print(json.dumps(flags, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    job_id = sys.argv[1] if len(sys.argv) > 1 else "test_job_126"
    asyncio.run(run(job_id))
