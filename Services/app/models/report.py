from pydantic import BaseModel
from typing import Literal

class PipelineRequest(BaseModel):
    url: str
    jobId: str

class FlaggedClaim(BaseModel):
    claim: str
    category: str
    status: Literal["Verified", "Misleading", "Unverifiable", "False"]
    evidence: str

class VisualFlag(BaseModel):
    issue: str
    description: str

class PipelineResponse(BaseModel):
    jobId: str
    url: str
    overall_score: int
    audio_score: int
    text_score: int
    verdict: str
    flagged_claims: list[FlaggedClaim]
    visual_flags: list[VisualFlag]
    language_detected: Literal["en", "hi", "hinglish", "unknown"]
