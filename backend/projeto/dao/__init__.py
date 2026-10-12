from projeto.config import Config
import mysql.connector

class BaseDAO:
    def __init__(self):
        self.__db_config = {
            'host': Config.MYSQL_HOST,
            'user': Config.MYSQL_USER,
            'password': Config.MYSQL_PASSWORD,
            'database': Config.MYSQL_DATABASE,
            'port': Config.MYSQL_PORT
        }

    def _get_connection(self):
        return mysql.connector.connect(**self.__db_config)

    @staticmethod
    def iso_utc(valor):
        return valor.isoformat(timespec='milliseconds') + 'Z' if valor else None

from .userDAO import UserDAO
from .postagemDAO import PostagemDAO
from .historicoSenhaDAO import HistoricoSenhaDAO
from .comentarioDAO import ComentarioDAO
from .denunciaDAO import DenunciaDAO
from .seguidorDAO import SeguidorDAO
from .assistenteDAO import AssistenteDAO
from .mensagemDAO import MensagemDAO
from .notificacaoDAO import NotificacaoDAO