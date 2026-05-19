from fastapi import FastAPI
from app.routes.pipeline import router

app = FastAPI(
    title="ClaimLens AI Pipeline",
    description="Internal AI pipeline service — not exposed to users directly.",
    version="1.0.0",
)

app.include_router(router)


@app.get("/health")
async def health():
    """Health check endpoint for Railway."""
    return {"status": "ok"}
