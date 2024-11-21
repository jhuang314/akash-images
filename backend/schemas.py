import pydantic
from typing import Optional

class _PromptBase(pydantic.BaseModel):
    seed: Optional[int] = 42
    num_inference_steps: int = 10
    guidance_scale: float = 7.5
    negative_prompt: str = ''

class ImageCreate(_PromptBase):
    prompt: str
