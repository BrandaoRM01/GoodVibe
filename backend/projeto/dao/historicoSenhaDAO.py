from . import BaseDAO
from werkzeug.security import check_password_hash

class HistoricoSenhaDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def listar_senhas_usuario(self, usuario_email):
        sql = '''
            SELECT senha_hash
            FROM historico_senhas
            WHERE usuario_email = %s
            ORDER BY criado_em ASC
        '''
        valor = [usuario_email]
        lista_senhas = []

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valor)
            for linha in cursor.fetchall():
                lista_senhas.append(linha['senha_hash'])
        finally:
            cursor.close()
            conexao.close()

        return lista_senhas

    def inserir_nova_senha(self, historico_senha):
        sql = '''
            INSERT INTO historico_senhas (
                usuario_email,
                senha_hash,
                criado_em
            )
            VALUES (%s, %s, NOW())
        '''
        valores = [
            historico_senha.usuario.email,
            historico_senha.senha_hash
        ]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def remover_senha_antiga(self, usuario_email):
        sql = '''
            DELETE FROM historico_senhas
            WHERE usuario_email = %s
            ORDER BY criado_em ASC
            LIMIT 1
        '''
        valor = [usuario_email]

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valor)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def senha_existe(self, usuario, senha):
        senhas_antigas = self.listar_senhas_usuario(usuario.email)

        for hash_antigo in senhas_antigas:
            if check_password_hash(hash_antigo, senha):
                return True

        return False