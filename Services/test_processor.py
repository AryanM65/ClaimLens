import asyncio
from app.services.processor import extract_audio_and_frames
from app.utils.storage import get_job_dir
import os

async def test():
    job_id = "test_job_125"
    job_dir = get_job_dir(job_id)
    
    # We will use the video that was already downloaded in the previous test
    video_path = None
    if os.path.exists(job_dir):
        for f in os.listdir(job_dir):
            if f.startswith("video."):
                video_path = os.path.join(job_dir, f)
                break
                
    if not video_path:
        print("Could not find the downloaded video. Please run test_downloader.py first.")
        return

    print(f"Processing video: {video_path}")
    try:
        audio_path, frames_dir = await extract_audio_and_frames(video_path, job_dir)
        print("Success! Extraction complete.")
        if audio_path:
            print(f"Audio path: {audio_path}")
            print(f"Audio size: {os.path.getsize(audio_path)} bytes")
        else:
            print("No audio track found in this video.")
            
        frames = [f for f in os.listdir(frames_dir) if f.endswith(".jpg")]
        print(f"Frames extracted: {len(frames)} frames found in {frames_dir}")
        if frames:
            print(f"First frame: {frames[0]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
