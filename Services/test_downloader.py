import asyncio
from app.services.downloader import download
from app.utils.storage import get_job_dir, cleanup_job
import os

async def test():
    job_id = "test_job_125"
    job_dir = get_job_dir(job_id)
    url = "https://www.instagram.com/p/DXn4MnkALVt/?igsh=MWdtc3R1YmswNXoyMw==" # Instagram video
    
    print("Ensuring a clean slate...")
    cleanup_job(job_dir)
    os.makedirs(job_dir, exist_ok=True)
    
    print(f"Downloading {url} to {job_dir}...")
    try:
        video_path = await download(url, job_dir)
        print(f"Success! Downloaded to: {video_path}")
        print(f"File size: {os.path.getsize(video_path)} bytes")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Skipping cleanup so you can inspect the file...")
        # cleanup_job(job_dir)
        print("Done.")

if __name__ == "__main__":
    asyncio.run(test())
