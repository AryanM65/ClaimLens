import os
import shutil


def get_job_dir(job_id: str) -> str:
    """
    Returns the temp directory path for a given job.
    Creates it if it doesn't exist.
    For local dev: uses /tmp/{jobId}/
    TODO: swap for Cloudflare R2 before Railway deployment
    """
    # On Windows use a local temp folder instead of /tmp
    base = os.path.join(os.getcwd(), "tmp")
    path = os.path.join(base, job_id)
    os.makedirs(path, exist_ok=True)
    return path


def cleanup_job(job_dir: str) -> None:
    """
    Deletes the entire job temp directory after the pipeline finishes.
    """
    if os.path.exists(job_dir):
        shutil.rmtree(job_dir)
