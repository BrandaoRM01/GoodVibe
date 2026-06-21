from . import BaseDAO
from projeto.factorys import UsuarioFactory
from projeto.config import Config
from werkzeug.security import generate_password_hash
import os

class UserDAO(BaseDAO):

    def __init__(self):
        super().__init__()
    
    def __pegar_foto_usuario(self, email):
        sql = """
            SELECT *
            FROM usuarios
            WHERE email = %s
        """
        valor = [email]

        resultado = None

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valor)
            resultado = cursor.fetchone()

        finally:
            cursor.close()
            conexao.close()

        return resultado
    
    def criar_usuario_superadmin(self):
        superadmin_email = Config.SUPERADMIN_EMAIL
        superadmin_senha = Config.SUPERADMIN_PASSWORD
        superadmin_username = Config.SUPERADMIN_USERNAME

        usuario = self.buscar_usuario_por_email(superadmin_email)

        if not usuario:
            senha_hash = generate_password_hash(superadmin_senha)

            superadmin = UsuarioFactory.criar_usuario(
                tipo_usuario="superadmin",
                email=superadmin_email,
                senha_hash=senha_hash,
                url_foto="img/default/user_foto.webp",
                username=superadmin_username.capitalize().strip()
            )

            self.cadastrar_usuario(superadmin)
    
    def cadastrar_usuario(self, novo_usuario):
        sql = """
            INSERT INTO usuarios (
                email,
                senha_hash,
                url_foto,
                username,
                tipo_usuario
            )
            VALUES (%s, %s, %s, %s, %s)
        """

        valores = [
            novo_usuario.email,
            novo_usuario.senha_hash,
            novo_usuario.url_foto,
            novo_usuario.username,
            novo_usuario.tipo_usuario()
        ]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def buscar_usuario_por_email(self, email):
        sql = """
            SELECT *
            FROM usuarios
            WHERE email = %s
        """
        valor = [email]

        usuario_encontrado = None

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valor)
            resultado = cursor.fetchone()

            if resultado:
                usuario_encontrado = UsuarioFactory.criar_usuario(**resultado)
             
        finally:
            cursor.close()
            conexao.close()

        return usuario_encontrado
    
    def listar_usuarios(self):
        sql = """
            SELECT *
            FROM usuarios
            ORDER BY tipo_usuario DESC, email ASC
        """
        lista_usuarios = []

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                usuario = UsuarioFactory.criar_usuario(**linha)

                lista_usuarios.append(usuario)
        finally:
            cursor.close()
            conexao.close()

        return lista_usuarios
    
    def excluir_usuario(self, email):
        sql = """
            DELETE 
            FROM usuarios
            WHERE email = %s
        """
        valor = [email]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            resultado = self.__pegar_foto_usuario(email)

            if resultado:
                url_foto = resultado['url_foto']

                if url_foto != "img/default/user_foto.webp":

                    caminho_foto = os.path.join(Config.BASE_DIR, "static", url_foto)

                    if os.path.exists(caminho_foto):
                        os.remove(caminho_foto)

            cursor.execute(sql, valor)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def pegar_usernames(self):
        sql = """
            SELECT username
            FROM usuarios
        """
        lista_usernames = []

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                username = linha['username']

                lista_usernames.append(username)
        finally:
            cursor.close()
            conexao.close()

        return lista_usernames
    
    def alterar_permissao_usuario(self, usuario_atualizado, tipo_usuario):
        sql = '''
            UPDATE usuarios
            SET tipo_usuario = %s
            WHERE email = %s
        '''
        valores = [
            tipo_usuario,
            usuario_atualizado.email
        ]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def editar_usuario(self, usuario_atualizado):
        sql = '''
            UPDATE usuarios
            SET 
                username = %s,
                senha_hash = %s,
                url_foto = %s
            WHERE email = %s
        '''
        valores = [
            usuario_atualizado.username,
            usuario_atualizado.senha_hash,
            usuario_atualizado.url_foto,
            usuario_atualizado.email
        ]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def salvar_token_recuperacao(self, email, token, expiracao):
        sql = '''
            UPDATE usuarios
            SET token_recuperacao = %s,
                token_expiracao = %s
            WHERE email = %s
        '''

        valores = [token, expiracao, email]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def buscar_por_token(self, token):
        sql = '''
            SELECT *
            FROM usuarios
            WHERE token_recuperacao = %s
        '''
        valor = [token]

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        usuario = None

        try:
            cursor.execute(sql, valor)
            resultado = cursor.fetchone()

            if resultado:
                usuario = UsuarioFactory.criar_usuario(**resultado)

        finally:
            cursor.close()
            conexao.close()

        return usuario
    
    def limpar_token(self, email):
        sql = '''
            UPDATE usuarios
            SET token_recuperacao = NULL,
                token_expiracao = NULL
            WHERE email = %s
        '''
        valor = [email]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valor)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()