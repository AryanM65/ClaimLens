# ── Stage: runtime ────────────────────────────────────────────────────────────
FROM python:3.12-slim

# System dependencies:
#   ffmpeg        — video download + audio/frame extraction
#   tesseract-ocr — base OCR engine
#   tesseract-ocr-hin — Hindi (Devanagari) language pack for Tesseract
#   libgl1        — required by OpenCV (cv2.imread)
#   libglib2.0-0  — required by OpenCV on Debian slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-hin \
    libgl1 \
    libglib2.0-0 \
    nodejs \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app/ ./app/

EXPOSE 8000

# --loop asyncio ensures ProactorEventLoop is used — required for
# asyncio.create_subprocess_exec() to work correctly.
CMD ["python", "-m", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--loop", "asyncio"]
