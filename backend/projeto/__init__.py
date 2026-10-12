from flask import Flask, send_from_directory
from flask_cors import CORS
from projeto.config import Config
from projeto.dao import UserDAO, HistoricoSenhaDAO
from projeto.models import HistoricoSenha
from werkzeug.security import generate_password_hash
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.config.setdefault('SECRET_KEY', os.environ.get('SECRET_KEY', 'secret_key_goodvibe'))

    origens_permitidas = [
        "https://SEU-PROJETO.lovable.app",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
    ]

    CORS(
        app,
        resources={r"/api/*": {"origins": origens_permitidas}},
        supports_credentials=False,
    )

    from projeto.realtime import socketio
    socketio.init_app(app, cors_allowed_origins=origens_permitidas, async_mode='threading')

    from projeto.blueprints import (
        user_bp, postagem_bp, comentario_bp, denuncia_bp, seguidor_bp, assistente_bp,
        mensagem_bp, notificacao_bp, recuperacao_senha_bp
    )
    app.register_blueprint(user_bp)
    app.register_blueprint(postagem_bp)
    app.register_blueprint(comentario_bp)
    app.register_blueprint(denuncia_bp)
    app.register_blueprint(seguidor_bp)
    app.register_blueprint(assistente_bp)
    app.register_blueprint(mensagem_bp)
    app.register_blueprint(notificacao_bp)
    app.register_blueprint(recuperacao_senha_bp)

    @app.route('/uploads/<path:subpath>')
    def servir_uploads(subpath):
        return send_from_directory(Config.BASE_DIR / 'uploads', subpath)

    with app.app_context():
        user_dao = UserDAO()
        historico_senha_dao = HistoricoSenhaDAO()

        user_dao.criar_usuario_superadmin()

        usuario = user_dao.buscar_usuario_por_email(Config.SUPERADMIN_EMAIL)
        senha = Config.SUPERADMIN_PASSWORD

        if usuario and not historico_senha_dao.senha_existe(usuario, senha):
            senha_hash = generate_password_hash(senha)

            historico = HistoricoSenha(usuario, senha_hash)
            historico_senha_dao.inserir_nova_senha(historico)

    return app