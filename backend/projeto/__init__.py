from flask import Flask
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

    from projeto.blueprints import user_bp
    app.register_blueprint(user_bp)

    with app.app_context():
        user_dao = UserDAO()
        user_dao.criar_usuario_superadmin()

    return app