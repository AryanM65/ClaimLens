"""
Isolated test for Serper + Gemini fact-checking (verify_claims).
Loads claims from a previously run job and fact-checks them.

Usage:
  python test_factchecker.py [job_id]
"""

import asyncio
import json
import os
import sys
from app.services.factchecker import verify_claims
from app.utils.storage import get_job_dir


def _safe(text: str) -> str:
    enc = sys.stdout.encoding or "utf-8"
    return text.encode(enc, errors="replace").decode(enc, errors="replace")


def _load_claims_from_file(text_file: str) -> list[dict]:
    """Parse the EXTRACTED CLAIMS section from extracted_text.txt."""
    with open(text_file, encoding="utf-8") as f:
        content = f.read()

    claims = []
    try:
        start = content.index("GEMINI CALL 2")
        start = content.index("\n\n", start) + 2
        section = content[start:]
        # Each claim block: "N. [category]\n   claim text\n\n"
        for block in section.strip().split("\n\n"):
            lines = block.strip().splitlines()
            if len(lines) >= 2 and lines[0][0].isdigit():
                category = lines[0].split("[")[1].rstrip("]") if "[" in lines[0] else "other"
                claim_text = lines[1].strip()
                if claim_text:
                    claims.append({"claim": claim_text, "category": category})
    except (ValueError, IndexError):
        pass

    return claims


async def run(job_id: str):
    job_dir   = get_job_dir(job_id)
    text_file = os.path.join(job_dir, "extracted_text.txt")

    if not os.path.exists(text_file):
        print(f"ERROR: extracted_text.txt not found in {job_dir}")
        print("Run test_pipeline_v1.py first.")
        return

    claims = _load_claims_from_file(text_file)

    print(f"\nJob ID  : {job_id}")
    print(f"Claims  : {len(claims)} to fact-check\n")

    if not claims:
        print("No claims found in extracted_text.txt — run the pipeline first.")
        return

    print("=" * 60)
    print("CLAIMS BEING FACT-CHECKED")
    print("=" * 60)
    for i, c in enumerate(claims, 1):
        print(f"{i}. [{c['category']}] {_safe(c['claim'])}")

    print("\n" + "=" * 60)
    print("Running Serper search + Gemini labelling...")
    print("=" * 60 + "\n")

    import time
    t = time.time()
    results = await verify_claims(claims)
    elapsed = time.time() - t

    print(f"Done in {elapsed:.2f}s\n")

    print("=" * 60)
    print("FACT-CHECK RESULTS")
    print("=" * 60)

    status_icons = {
        "Verified":     "[OK]     ",
        "Misleading":   "[MISLEAD]",
        "Unverifiable": "[?]      ",
        "False":        "[FALSE]  ",
    }

    for r in results:
        icon   = status_icons.get(r.get("status", ""), "[?]      ")
        status = r.get("status", "Unverifiable")
        print(f"\n{icon}  [{status}]")
        print(f"   Claim        : {_safe(r.get('claim', ''))}")
        print(f"   Search query : {_safe(r.get('search_query', ''))}")
        print(f"   Evidence     : {_safe(r.get('evidence', ''))}")
        snippets = r.get("snippets", [])
        if snippets:
            print("   Serper results:")
            for s in snippets:
                print(f"     - {_safe(s)}")

    print("\n" + "=" * 60)
    print("RAW JSON:")
    sys.stdout.buffer.write(
        json.dumps(results, indent=2, ensure_ascii=False).encode("utf-8")
    )
    sys.stdout.buffer.write(b"\n")


if __name__ == "__main__":
    job_id = sys.argv[1] if len(sys.argv) > 1 else "test_job_136"
    asyncio.run(run(job_id))
