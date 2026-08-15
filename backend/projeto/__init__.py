from flask import Flask, send_from_directory
from flask_cors import CORS
from projeto.config import Config
from projeto.dao import UserDAO
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

    from projeto.blueprints import user_bp, postagem_bp
    app.register_blueprint(user_bp)
    app.register_blueprint(postagem_bp)

    @app.route('/uploads/<path:subpath>')
    def servir_uploads(subpath):
        return send_from_directory(Config.BASE_DIR / 'uploads', subpath)

    with app.app_context():
        user_dao = UserDAO()
        user_dao.criar_usuario_superadmin()

    return app