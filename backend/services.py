from pathlib import Path
import schemas

import torch
from diffusers import StableDiffusionPipeline, StableDiffusion3Pipeline
from PIL.Image import Image
import os
from dotenv import load_dotenv

from celery import shared_task, Celery, Task

celery = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0',
)
celery.conf.update(
    event_serializer='pickle',
    task_serializer='pickle',
    result_serializer='pickle',
    accept_content = ['application/json', 'application/x-python-serialize'],
)



load_dotenv()
HF_TOKEN = os.getenv('HF_TOKEN')
print('hf token', HF_TOKEN)

class GenerateImageTask(Task):
    def __init__(self):
        super().__init__()
        self.pipe = None

    def __call__(self, *args, **kwargs):
        if not self.pipe:

            if torch.cuda.is_available():
                device = "cuda"
            elif torch.backends.mps.is_available():
                device = "mps"
            else:
                device = "cpu"


            if device == 'cpu' or device == 'gpu':
                pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
            else:
                pipe = StableDiffusion3Pipeline.from_pretrained(
                    "stabilityai/stable-diffusion-3.5-medium",
                    torch_dtype=torch.bfloat16,
                )


            pipe.to(device)
            self.pipe = pipe

        return self.run(*args, **kwargs)

if celery.current_worker_task:
    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"



    if device == 'cpu' or device == 'gpu':
        pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
    else:
        pipe = StableDiffusion3Pipeline.from_pretrained(
            "stabilityai/stable-diffusion-3.5-medium",
            torch_dtype=torch.bfloat16,
        )



    pipe.to(device)


async def generate_image(imgPrompt: schemas.ImageCreate) -> Image:
    generator = None if imgPrompt.seed is None else torch.Generator().manual_seed(int(imgPrompt.seed))

    image: Image = pipe(
        prompt=imgPrompt.prompt,
        negative_prompt=imgPrompt.negative_prompt,
        guidance_scale=imgPrompt.guidance_scale,
        num_inference_steps=imgPrompt.num_inference_steps,
        generator = generator,
    ).images[0]

    return image

@shared_task(bind=True, base = GenerateImageTask)
def generate_image_task(self, imgPrompt: schemas.ImageCreate) -> Image:
    generator = None if imgPrompt.seed is None else torch.Generator().manual_seed(int(imgPrompt.seed))

    image: Image = self.pipe(
        prompt=imgPrompt.prompt,
        negative_prompt=imgPrompt.negative_prompt,
        guidance_scale=imgPrompt.guidance_scale,
        num_inference_steps=imgPrompt.num_inference_steps,
        generator = generator,
    ).images[0]

    return image
