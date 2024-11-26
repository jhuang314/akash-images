from pathlib import Path
import schemas

import torch
from diffusers import StableDiffusionPipeline, StableDiffusion3Pipeline
from diffusers.pipelines.stable_diffusion_3.pipeline_output import StableDiffusion3PipelineOutput
import base64
from io import BytesIO
from PIL.Image import Image
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

    def __call__(self, *args, **kwargs):
        if not self.pipe:

            if torch.cuda.is_available():
                device = "cuda"
            elif torch.backends.mps.is_available():
                device = "mps"
            else:
                device = "cpu"
            print('found device', device)


            if device == 'cpu':
                pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
            else:
                pipe = StableDiffusion3Pipeline.from_pretrained(
                    "stabilityai/stable-diffusion-3.5-medium",
                    torch_dtype=torch.bfloat16,
                )


            pipe.to(device)
            self.pipe = pipe

        return self.run(*args, **kwargs)



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


    image: Image = self.pipe(
        prompt=imgPrompt.prompt,
        negative_prompt=imgPrompt.negative_prompt,
        guidance_scale=imgPrompt.guidance_scale,
        num_inference_steps=imgPrompt.num_inference_steps,
        generator = generator,
        callback_on_step_end=decode_tensors,
        callback_on_step_end_tensor_inputs=["latents"],
    ).images[0]

    return image


@task_success.connect(sender=generate_image_task)
def task_success_notifier(sender=None, **kwargs):

    taskId = sender.request.id

    external_sio.emit('task completed', {'taskId': taskId})

    print("From task_success_notifier ==> Task run successfully!")
