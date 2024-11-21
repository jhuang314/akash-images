from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import fastapi
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request

import schemas as _schemas
import services as _services
import io

app = FastAPI()

templates = Jinja2Templates(directory="../frontend/build")
app.mount('/static', StaticFiles(directory="../frontend/build/static"), 'static')

@app.get('/api/health')
async def health():
    return { 'status': 'healthy' }


@app.get("/api")
async def root():
    return {"message": "Hello there"}

@app.get("/api/generate/")
async def generate_image(imgPromptCreate: _schemas.ImageCreate = fastapi.Depends()):
    print('called /api/generate endpoint', imgPromptCreate)
    image = await _services.generate_image(imgPrompt=imgPromptCreate)

    memory_stream = io.BytesIO()
    image.save(memory_stream, format="PNG")
    memory_stream.seek(0)
    return StreamingResponse(memory_stream, media_type="image/png")


# Serve the react app's static files
@app.get("/{rest_of_path:path}")
async def react_app(req: Request, rest_of_path: str):
    print(f'Rest of path: {rest_of_path}')
    return templates.TemplateResponse('index.html', { 'request': req })
