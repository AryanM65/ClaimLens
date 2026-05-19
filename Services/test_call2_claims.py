"""
Isolated test for Gemini Call 2 — Claim Extraction.
Loads transcript + OCR from a previously run job and extracts claims.

Usage:
  python test_call2_claims.py [job_id]
"""

import asyncio
import json
import os
import sys
from app.services.analyser import extract_claims
from app.utils.storage import get_job_dir


def _safe(text: str) -> str:
    """Encode text safely for the current Windows console encoding."""
    enc = sys.stdout.encoding or "utf-8"
    return text.encode(enc, errors="replace").decode(enc, errors="replace")


def _load_section(content: str, header: str, next_header: str) -> str:
    """Extract a section from extracted_text.txt between two headers."""
    try:
        start = content.index(header)
        start = content.index("\n\n", start) + 2   # skip past the header line
        end   = content.index(next_header, start)
        return content[start:end].strip()
    except ValueError:
        return ""


async def run(job_id: str):
    job_dir   = get_job_dir(job_id)
    text_file = os.path.join(job_dir, "extracted_text.txt")

    if not os.path.exists(text_file):
        print(f"ERROR: extracted_text.txt not found in {job_dir}")
        print("Run test_pipeline_v1.py first.")
        return

    with open(text_file, encoding="utf-8") as f:
        content = f.read()

    # Pull transcript and OCR from saved output
    transcript   = _load_section(content, "TRANSCRIPT (SARVAM", "=" * 10)
    ocr_combined = _load_section(content, "OCR COMBINED",       "=" * 10)

    print(f"\nJob ID     : {job_id}")
    print(f"Transcript : {len(transcript)} chars")
    print(f"OCR text   : {len(ocr_combined)} chars")
    print()

    # Show what's going in
    print("=" * 60)
    print("INPUT TO GEMINI CALL 2")
    print("=" * 60)
    print(f"\nTRANSCRIPT:\n{_safe(transcript or '(empty)')}")
    print(f"\nOCR TEXT:\n{_safe(ocr_combined or '(empty)')}")

    print("\n" + "=" * 60)
    print("Running Gemini Call 2 (claim extraction)...")
    print("=" * 60)

    import time
    t = time.time()
    claims = await extract_claims(transcript, ocr_combined)
    elapsed = time.time() - t

    print(f"\nDone in {elapsed:.2f}s — {len(claims)} claims extracted\n")
    print("=" * 60)
    print("EXTRACTED CLAIMS")
    print("=" * 60)

    if not claims:
        print("No factual claims found.")
    else:
        for i, c in enumerate(claims, 1):
            print(f"\n{i}. [{c.get('category')}]")
            print(f"   {_safe(c.get('claim', ''))}")

    print("\n" + "=" * 60)
    print("RAW JSON:")
    print(json.dumps(claims, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    job_id = sys.argv[1] if len(sys.argv) > 1 else "test_job_126"
    asyncio.run(run(job_id))
