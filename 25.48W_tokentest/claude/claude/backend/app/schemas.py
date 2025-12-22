from pydantic import BaseModel
from typing import Optional

class SummarizeRequest(BaseModel):
    provider: str
    model: str
    system_prompt: Optional[str]
    output_mode: str
    text: Optional[str]

class SummarizeResponse(BaseModel):
    summary: str
    provider: str
    model: str
