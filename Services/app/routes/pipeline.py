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
    """
    job_dir = get_job_dir(request.jobId)
    print(f"\n==================== [START PIPELINE RUN: {request.jobId}] ====================")
    print(f"[Services Pipeline] Target URL: {request.url}")

    try:
        # Step 1 — Download
        print(f"[Services Pipeline] [Step 1/7] Downloading video using yt-dlp...")
        video_path = await downloader.download(request.url, job_dir)
        print(f"[Services Pipeline] [Step 1/7 SUCCESS] Video downloaded successfully. Saved file: {video_path}")

        # Step 2 — Extract audio + frames
        print(f"[Services Pipeline] [Step 2/7] Extracting audio streams & keyframes via FFmpeg...")
        audio_path, frames_dir = await processor.extract_audio_and_frames(video_path, job_dir)
        print(f"[Services Pipeline] [Step 2/7 SUCCESS] Audio saved: {audio_path}. Frames stored: {frames_dir}")

        # Step 3 — PARALLEL: transcribe audio AND run OCR on frames simultaneously
        print(f"[Services Pipeline] [Step 3/7] Running dual asynchronous processing: Transcribing audio (Sarvam AI) & Scanning OCR on keyframes...")
        transcript_result, ocr_text = await asyncio.gather(
            transcriber.transcribe(audio_path),
            ocr.extract_text_from_frames(frames_dir),
        )

        transcript = transcript_result["text"]
        language   = transcript_result["language"]
        print(f"[Services Pipeline] [Step 3/7 SUCCESS] Audio transcription completed (Language detected: {language}). OCR analysis finished.")

        # Step 4 — Gemini call 1: Visual analysis of keyframes
        print(f"[Services Pipeline] [Step 4/7] Requesting Gemini Visual Analysis (Call 1) to inspect sampled frames for manipulation...")
        visual_flags = await analyser.visual_analysis(frames_dir, transcript)
        print(f"[Services Pipeline] [Step 4/7 SUCCESS] Gemini visual manipulation check complete. Visual flags detected: {len(visual_flags)}")

        # Step 5 — Gemini call 2: extract all factual claims from text/audio
        print(f"[Services Pipeline] [Step 5/7] Requesting Gemini Claim Extraction (Call 2) to filter verifiable claims...")
        claims = await analyser.extract_claims(transcript, ocr_text)
        print(f"[Services Pipeline] [Step 5/7 SUCCESS] Factual claims isolated. Candidate claims count: {len(claims)}")

        # Step 6 — Serper + Gemini: verify and label each claim
        print(f"[Services Pipeline] [Step 6/7] Querying Google Search (Serper API) & Fact-checking claims...")
        verified_claims = await factchecker.verify_claims(claims)
        print(f"[Services Pipeline] [Step 6/7 SUCCESS] Google Serper search & Gemini verification completed for {len(verified_claims)} claims.")

        # Step 7 — Gemini call 3: produce final scores, verdict, and structured report
        print(f"[Services Pipeline] [Step 7/7] Requesting Gemini Final Compilation (Call 3) to compute trust metrics & overall credibility scores...")
        report = await analyser.score_report(
            transcript,
            ocr_text,
            verified_claims,
            visual_flags,
            language,
        )
        print(f"[Services Pipeline] [Step 7/7 SUCCESS] Final structured credibility report compiled. Overall Credibility Score: {report.get('overall_score')}/100")

        # Attach request metadata
        report["jobId"]        = request.jobId
        report["url"]          = request.url

        print(f"==================== [SUCCESS PIPELINE RUN: {request.jobId}] ====================\n")
        return report

    except NotImplementedError as e:
        import traceback
        traceback.print_exc()
        print(f"[Services Pipeline FATAL ERROR] NotImplementedError caught: {str(e)}")
        raise HTTPException(status_code=501, detail=str(e))

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Services Pipeline FATAL ERROR] General Exception caught: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")

    finally:
        # Step 8 — Always cleanup temp files
        print(f"[Services Pipeline] Cleaning up temporary workspace directory: {job_dir}")
        cleanup_job(job_dir)
        print(f"[Services Pipeline] Temporary files evicted. Process concluded.")

