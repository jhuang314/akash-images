import socketio
from dotenv import load_dotenv
import os

load_dotenv()

# localhost redis: localhost:6379
# docker: redis:6379
REDIS_URL = os.getenv('REDIS_URL')
mgr = socketio.AsyncRedisManager('redis://{}/0'.format(REDIS_URL))

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins='*',
    client_manager=mgr,
    max_http_buffer_size=1e8,
)



@sio.event
def connect(sid, environ, auth):
    print('connect ', sid)

@sio.event
def disconnect(sid):
    print('disconnect ', sid)
