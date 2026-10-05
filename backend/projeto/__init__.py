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

    app.config.setdefault('SECRET_KEY', os.environ.get('SECRET_KEY', 'secret_key_para_caso_não_seja_informada'))

    CORS(
        app,
        resources={r"/api/*": {"origins": [
            "https://SEU-PROJETO.lovable.app",
            "http://localhost:8080",
             "http://localhost:5173",
        ]}},
        supports_credentials=False,
    )

    from projeto.blueprints import user_bp, postagem_bp, comentario_bp
    app.register_blueprint(user_bp)
    app.register_blueprint(postagem_bp)
    app.register_blueprint(comentario_bp)

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