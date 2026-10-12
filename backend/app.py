from projeto import create_app
from projeto.realtime import socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(app, allow_unsafe_werkzeug=True)