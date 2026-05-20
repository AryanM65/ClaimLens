import os
import boto3
from botocore.config import Config
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Load R2 configuration from environment
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_ACCESS_KEY_ID = os.getenv("CLOUDFLARE_ACCESS_KEY_ID")
CLOUDFLARE_SECRET_ACCESS_KEY = os.getenv("CLOUDFLARE_SECRET_ACCESS_KEY")
CLOUDFLARE_BUCKET_NAME = os.getenv("CLOUDFLARE_BUCKET_NAME")
CLOUDFLARE_PUBLIC_URL = os.getenv("CLOUDFLARE_PUBLIC_URL", "").rstrip("/")

_executor = ThreadPoolExecutor(max_workers=5)

class R2Storage:
    def __init__(self):
        # Only initialize if credentials are provided
        if CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ACCESS_KEY_ID and CLOUDFLARE_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=CLOUDFLARE_ACCESS_KEY_ID,
                aws_secret_access_key=CLOUDFLARE_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto" # Cloudflare R2 doesn't use regions, auto is standard
            )
            self.enabled = True
        else:
            self.s3_client = None
            self.enabled = False

    def _sync_upload(self, local_path: str, key: str, content_type: str = None) -> str:
        if not self.enabled:
            return ""
        
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
            
        self.s3_client.upload_file(
            local_path,
            CLOUDFLARE_BUCKET_NAME,
            key,
            ExtraArgs=extra_args
        )
        return f"{CLOUDFLARE_PUBLIC_URL}/{key}"

    async def upload_file(self, local_path: str, key: str, content_type: str = None) -> str:
        """
        Uploads a local file to Cloudflare R2 asynchronously.
        Returns the public URL of the uploaded file.
        """
        if not self.enabled:
            print("[R2] Warning: Cloudflare R2 credentials missing. Skipping upload.")
            return ""

        if not os.path.exists(local_path):
            print(f"[R2] Error: Local file not found: {local_path}")
            return ""

        loop = asyncio.get_running_loop()
        try:
            url = await loop.run_in_executor(
                _executor, 
                self._sync_upload, 
                local_path, 
                key, 
                content_type
            )
            print(f"[R2] Successfully uploaded {local_path} -> {url}")
            return url
        except Exception as e:
            print(f"[R2] Failed to upload {local_path}: {e}")
            return ""

# Singleton instance
r2_storage = R2Storage()
