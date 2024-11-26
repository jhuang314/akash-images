from pathlib import Path
import schemas

import torch
from diffusers import StableDiffusionPipeline, StableDiffusion3Pipeline
from diffusers.pipelines.stable_diffusion_3.pipeline_output import StableDiffusion3PipelineOutput
import base64
from io import BytesIO
from PIL.Image import Image
import PIL
import os
from dotenv import load_dotenv

from celery import shared_task, Celery, Task
from celery.signals import task_success

from socket_handler import sio
import socketio

from asgiref import sync

load_dotenv()


# localhost redis: localhost:6379
# docker: redis:6379
REDIS_URL = os.getenv('REDIS_URL')
print('redis url', REDIS_URL)

celery = Celery(
    'tasks',
    broker='redis://{}/0'.format(REDIS_URL),
    backend='redis://{}/0'.format(REDIS_URL),
)
celery.conf.update(
    event_serializer='pickle',
    task_serializer='pickle',
    result_serializer='pickle',
    accept_content = ['application/json', 'application/x-python-serialize'],
)

external_sio = socketio.RedisManager('redis://{}/0'.format(REDIS_URL), write_only=True)


HF_TOKEN = os.getenv('HF_TOKEN')
print('hf token', HF_TOKEN)


class GenerateImageTask(Task):
    def __init__(self):
        super().__init__()
        self.pipe = None
        self.device = None

    def __call__(self, *args, **kwargs):
        if not self.pipe:

            if torch.cuda.is_available():
                device = "cuda"
            elif torch.backends.mps.is_available():
                device = "mps"
            else:
                device = "cpu"

            print('found device', device)

            # Use mini sd for cpu to speed up inference at expense of quality.
            if device == 'cpu':
                pipe = StableDiffusionPipeline.from_pretrained(
                    "lambdalabs/miniSD-diffusers",
                    # ran into lots of false positives for small steps
                    safety_checker = None,
                    requires_safety_checker = False,
                )

            else:
                pipe = StableDiffusion3Pipeline.from_pretrained(
                    "stabilityai/stable-diffusion-3.5-medium",
                    torch_dtype=torch.bfloat16,
                    # ran into lots of false positives for small steps
                    safety_checker = None,
                    requires_safety_checker = False,
                )



            pipe.to(device)
            self.pipe = pipe
            self.device = device

        return self.run(*args, **kwargs)



def latents_to_rgb_cpu(latents):
    weights = (
        (60, -60, 25, -70),
        (60,  -5, 15, -50),
        (60,  10, -5, -35),
    )

    weights_tensor = torch.t(torch.tensor(weights, dtype=latents.dtype).to(latents.device))
    biases_tensor = torch.tensor((150, 140, 130), dtype=latents.dtype).to(latents.device)
    rgb_tensor = torch.einsum("...lxy,lr -> ...rxy", latents, weights_tensor) + biases_tensor.unsqueeze(-1).unsqueeze(-1)
    image_array = rgb_tensor.clamp(0, 255).byte().cpu().numpy().transpose(1, 2, 0)

    return PIL.Image.fromarray(image_array)


def latents_to_rgb(latents,pipe):
    latents = (latents / pipe.vae.config.scaling_factor) + pipe.vae.config.shift_factor

    img = pipe.vae.decode(latents, return_dict=False)[0]
    img = pipe.image_processor.postprocess(img, output_type="pil")

    return StableDiffusion3PipelineOutput(images=img).images[0]


@shared_task(bind=True, base = GenerateImageTask)
def generate_image_task(self, imgPrompt: schemas.ImageCreate) -> Image:
    generator = None if imgPrompt.seed is None else torch.Generator().manual_seed(int(imgPrompt.seed))

    taskId = self.request.id

    def decode_tensors(pipe, step, timestep, callback_kwargs):
        latents = callback_kwargs["latents"]

        image = latents_to_rgb(latents, pipe)

        buffered = BytesIO()
        image.save(buffered, format="JPEG", optimize=True, quality=25)
        image_encoded = base64.b64encode(buffered.getvalue()).decode('utf-8')

        external_sio.emit('task updated', {'taskId': taskId, 'iteration': step + 1, 'image64': image_encoded})

        return callback_kwargs

    def decode_tensors_cpu(pipe, step, timestep, callback_kwargs):
        latents = callback_kwargs["latents"]

        image = latents_to_rgb_cpu(latents[0])
        image = image.resize((1024, 1024), PIL.Image.LANCZOS)

        buffered = BytesIO()
        image.save(buffered, format="JPEG", optimize=True, quality=25)
        image_encoded = base64.b64encode(buffered.getvalue()).decode('utf-8')

        external_sio.emit('task updated', {'taskId': taskId, 'iteration': step, 'image64': image_encoded})

        return callback_kwargs


    image: Image = self.pipe(
        prompt=imgPrompt.prompt,
        prompt_3=imgPrompt.prompt,
        negative_prompt=imgPrompt.negative_prompt,
        guidance_scale=imgPrompt.guidance_scale,
        num_inference_steps=imgPrompt.num_inference_steps,
        generator = generator,
        max_sequence_length=512,
        callback_on_step_end=decode_tensors_cpu if self.device == 'cpu' else decode_tensors,
        callback_on_step_end_tensor_inputs=["latents"],
        height = 256 if self.device == 'cpu' else 1024,
        width = 256 if self.device == 'cpu' else 1024,
    ).images[0]

    if self.device == 'cpu':
        return image.resize((1024, 1024), PIL.Image.LANCZOS)

    return image


@task_success.connect(sender=generate_image_task)
def task_success_notifier(sender=None, **kwargs):

    taskId = sender.request.id

    external_sio.emit('task completed', {'taskId': taskId})

    print("From task_success_notifier ==> Task run successfully!")
