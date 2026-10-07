import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app
from projeto.dao import UserDAO

def gerar_token(usuario_dict, expira_em_horas=24):
    payload = {
        **usuario_dict,
        'exp': datetime.now(timezone.utc) + timedelta(hours=expira_em_horas),
        'iat': datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token

def decodificar_token(token):
    return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])

def extrair_token_da_request():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1]
    return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = extrair_token_da_request()

        if not token:
            return jsonify({'erro': 'Token não fornecido. Faça login novamente.'}), 401

        try:
            payload = decodificar_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'Sessão expirada. Faça login novamente.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido.'}), 401

        # As permissões vêm do banco, e não do token, para valerem na hora quando alteradas
        usuario_db = UserDAO().buscar_usuario_por_email(payload.get('email'))

        if not usuario_db:
            return jsonify({'erro': 'Usuário não encontrado. Faça login novamente.'}), 401

        payload['tipo_usuario'] = usuario_db.tipo_usuario()
        payload['pode_moderar'] = usuario_db.pode_moderar()
        payload['pode_gerenciar_usuarios'] = usuario_db.pode_gerenciar_usuarios()

        request.usuario_atual = payload
        return f(*args, **kwargs)
    return decorated

def moderador_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        usuario = getattr(request, 'usuario_atual', None)
        if not usuario or not usuario.get('pode_moderar'):
            return jsonify({'erro': 'Você não tem permissão para acessar este recurso.'}), 403
        return f(*args, **kwargs)
    return decorated

def gerenciador_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        usuario = getattr(request, 'usuario_atual', None)
        if not usuario or not usuario.get('pode_gerenciar_usuarios'):
            return jsonify({'erro': 'Você não tem permissão para acessar este recurso.'}), 403
        return f(*args, **kwargs)
    return decorated
