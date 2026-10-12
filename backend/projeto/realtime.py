import jwt
from flask_socketio import SocketIO, join_room
from projeto.dao import UserDAO
from projeto.utils import decodificar_token

socketio = SocketIO()

def sala_usuario(email):
    return f"usuario:{email.lower()}"

def emitir_para_usuario(email, evento, dados):
    socketio.emit(evento, dados, to=sala_usuario(email))

@socketio.on('connect')
def ao_conectar(auth=None):
    token = auth.get('token') if isinstance(auth, dict) else None
    if not token:
        return False

    try:
        payload = decodificar_token(token)
    except jwt.PyJWTError:
        return False

    usuario = UserDAO().buscar_usuario_por_email(payload.get('email'))
    if not usuario:
        return False

    join_room(sala_usuario(usuario.email))