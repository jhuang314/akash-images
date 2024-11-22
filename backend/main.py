from PIL.Image import Image
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import fastapi
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request

import schemas as _schemas
import services
import io

from celery import Celery
from celery.result import AsyncResult

import socketio

socketio_server = socketio.AsyncServer(async_mode="asgi")

# from kombu.serialization import register
# import pydanticserializer

fastapi_app = FastAPI()

static_files = {
    '/static': '../frontend/build/static',
}

app = socketio.ASGIApp(
    socketio_server=socketio_server,
    other_asgi_app=fastapi_app,
    static_files=static_files,
)

templates = Jinja2Templates(directory="../frontend/build")
#app.mount('/static', StaticFiles(directory="../frontend/build/static"), 'static')

# # register(
# #     "pydantic",
# #     pydanticserializer.pydantic_dumps,
# #     pydanticserializer.pydantic_loads,
# #     content_type="application/x-pydantic",
# #     content_encoding="utf-8",
# # )

# celery = Celery(
#     'tasks',
#     broker='redis://localhost:6379/0',
#     backend='redis://localhost:6379/0',
# )

# # celery.conf.update(
# #     task_serializer="pydantic",
# #     result_serializer="pydantic",
# #     event_serializer="pydantic",
# #     accept_content=["application/json", "application/x-pydantic"],
# #     result_accept_content=["application/json", "application/x-pydantic"],
# # )
# celery.conf.update(
#     event_serializer='pickle',
#     task_serializer='pickle',
#     result_serializer='pickle',
#     accept_content = ['application/json', 'application/x-python-serialize'],
# )

@fastapi_app.get('/api/health')
async def health():
    return { 'status': 'healthy' }


@fastapi_app.get("/api")
async def root():
    return {"message": "Hello there"}

# @app.get("/api/generate/")
# async def generate_image(imgPromptCreate: _schemas.ImageCreate = fastapi.Depends()):
#     print('called /api/generate endpoint', imgPromptCreate)
#     image = await services.generate_image(imgPrompt=imgPromptCreate)

#     memory_stream = io.BytesIO()
#     image.save(memory_stream, format="PNG")
#     memory_stream.seek(0)
#     return StreamingResponse(memory_stream, media_type="image/png")





@fastapi_app.get("/api/generate2/")
async def generate_image2(imgPromptCreate: _schemas.ImageCreate = fastapi.Depends()):
    print('called /api/generate2 endpoint', imgPromptCreate)
    result = services.celery.send_task('services.generate_image_task', args=[imgPromptCreate])
    return {"message": "Task submitted", "task_id": result.id}



@fastapi_app.get("/task_status/{task_id}")
async def task_status(task_id: str):
    result = AsyncResult(task_id, app=services.celery)
    if result.ready():
        return {"status": "completed"}
    else:
        return {"status": "pending"}

@fastapi_app.get("/image/{task_id}")
async def get_image(task_id: str):
    result = AsyncResult(task_id, app=services.celery)
    if result.ready():
        print('result is ready')
        image = result.get()

        memory_stream = io.BytesIO()
        image.save(memory_stream, format="PNG")
        memory_stream.seek(0)
        return StreamingResponse(memory_stream, media_type="image/png")
    else:
        return {"status": "pending"}

# Serve the react app's static files
@fastapi_app.get("/{rest_of_path:path}")
async def react_app(req: Request, rest_of_path: str):
    print(f'Rest of path: {rest_of_path}')
    return templates.TemplateResponse('index.html', { 'request': req })
