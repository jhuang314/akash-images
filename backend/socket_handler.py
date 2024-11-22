import socketio

mgr = socketio.AsyncRedisManager('redis://localhost:6379/0')

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=[
    'http://localhost:5000',
    'http://localhost:3000',
    'https://admin.socket.io',
    ],
    client_manager=mgr,
)



@sio.event
def connect(sid, environ, auth):
    print('connect ', sid)

@sio.event
def disconnect(sid):
    print('disconnect ', sid)
