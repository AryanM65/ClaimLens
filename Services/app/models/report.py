from pydantic import BaseModel
from typing import Literal


class PipelineRequest(BaseModel):
    url: str
    jobId: str


class FlaggedClaim(BaseModel):
    claim: str
    status: Literal["Verified", "Misleading", "Unverifiable", "False"]
    evidence: str


class PipelineResponse(BaseModel):
    jobId: str
    url: str
    overall_score: int
    audio_score: int
    text_score: int
    verdict: str
    flagged_claims: list[FlaggedClaim]
    language_detected: Literal["en", "hi", "hinglish", "unknown"]
