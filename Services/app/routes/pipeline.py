import asyncio
from fastapi import APIRouter, HTTPException
from app.models.report import PipelineRequest, PipelineResponse
from app.services import downloader, processor, transcriber, ocr, analyser, factchecker
from app.utils.storage import get_job_dir, cleanup_job

router = APIRouter()


@router.post("/run-pipeline", response_model=PipelineResponse)
async def run_pipeline(request: PipelineRequest):
    """
    Main pipeline orchestrator. Called by the Node.js BullMQ worker.
    Runs all pipeline steps and returns the completed credibility report.

    Flow:
        1. Download video (yt-dlp)
        2. Extract audio + frames (ffmpeg)
        3. [PARALLEL] Transcribe audio (Sarvam AI) + OCR all frames (Tesseract)
        4. Visual manipulation analysis (Gemini Call 1)
        5. Extract claims from transcript + OCR text (Gemini Call 2)
        6. Fact-check each claim (Serper + Gemini)
        7. Score the full report (Gemini Call 3)
        8. Cleanup temp files
    """
    job_dir = get_job_dir(request.jobId)

    try:
        # Step 1 — Download
        video_path = await downloader.download(request.url, job_dir)

        # Step 2 — Extract audio + frames
        audio_path, frames_dir = await processor.extract_audio_and_frames(video_path, job_dir)

        # Step 3 — PARALLEL: transcribe audio AND run OCR on frames simultaneously
        transcript_result, ocr_text = await asyncio.gather(
            transcriber.transcribe(audio_path),
            ocr.extract_text_from_frames(frames_dir),
        )

        transcript = transcript_result["text"]
        language   = transcript_result["language"]

        # Step 4 — Gemini call 1: Visual analysis of keyframes
        visual_flags = await analyser.visual_analysis(frames_dir, transcript)

        # Step 5 — Gemini call 2: extract all factual claims from text/audio
        claims = await analyser.extract_claims(transcript, ocr_text)

        # Step 6 — Serper + Gemini: verify and label each claim
        verified_claims = await factchecker.verify_claims(claims)

        # Step 7 — Gemini call 3: produce final scores, verdict, and structured report
        report = await analyser.score_report(
            transcript,
            ocr_text,
            verified_claims,
            visual_flags,
            language,
        )

        # Attach request metadata
        report["jobId"]        = request.jobId
        report["url"]          = request.url

        return report

    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")

    finally:
        # Step 8 — Always cleanup temp files
        cleanup_job(job_dir)
