from dotenv import load_dotenv
from pathlib import Path
import sib_api_v3_sdk
import os

load_dotenv()

class Config:
    # Configurações Flask
    SECRET_KEY = os.getenv('SECRET_KEY')
    DEBUG = os.getenv('DEBUG')

    # Caminhos para upload
    BASE_DIR = Path(__file__).resolve().parent.parent

    UPLOAD_USER = os.path.join(BASE_DIR, 'static', 'uploads', 'user')
    UPLOAD_PONTOS = os.path.join(BASE_DIR, 'static', 'uploads', 'pontos')

    # Configurações MYSQL
    MYSQL_HOST = os.getenv('MYSQL_HOST')
    MYSQL_USER = os.getenv('MYSQL_USER')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE')
    MYSQL_PORT = os.getenv('MYSQL_PORT')

    # Informações necessárias do Superadmin
    SUPERADMIN_EMAIL = os.getenv('SUPERADMIN_EMAIL')
    SUPERADMIN_PASSWORD = os.getenv('SUPERADMIN_PASSWORD')
    SUPERADMIN_USERNAME = os.getenv('SUPERADMIN_USERNAME')

    # Configurações API Brevo
    BREVO_API_KEY = os.getenv('BREVO_API_KEY')

    BREVO_CONFIG = sib_api_v3_sdk.Configuration()
    BREVO_CONFIG.api_key['api-key'] = BREVO_API_KEY