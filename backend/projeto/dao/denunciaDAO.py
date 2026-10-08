from projeto.factorys import DenunciaFactory
from . import BaseDAO

_SQL_BASE = """
    SELECT
        d.id, d.tipo, d.motivo, d.descricao, d.criado_em,
        d.postagem_id, d.comentario_id,
        d.denunciante_email,
        ud.username AS denunciante_username,
        ud.url_foto AS denunciante_url_foto,
        COALESCE(p.conteudo, c.conteudo) AS alvo_conteudo,
        p.url_imagem AS alvo_imagem,
        COALESCE(up.email, uc.email) AS alvo_autor_email,
        COALESCE(up.username, uc.username) AS alvo_autor_username,
        COALESCE(d.postagem_id, c.postagem_id) AS alvo_postagem_id
    FROM denuncias d
    INNER JOIN usuarios ud ON ud.email = d.denunciante_email
    LEFT JOIN postagens p ON p.id = d.postagem_id
    LEFT JOIN usuarios up ON up.email = p.autor_email
    LEFT JOIN comentarios c ON c.id = d.comentario_id
    LEFT JOIN usuarios uc ON uc.email = c.autor_email
"""

class DenunciaDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def __montar(self, sql, valores=None):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores or [])
            return [DenunciaFactory.criar_denuncia(**linha) for linha in cursor.fetchall()]
        finally:
            cursor.close()
            conexao.close()

    def listar(self, limite, offset):
        sql = _SQL_BASE + " ORDER BY d.criado_em DESC, d.id DESC LIMIT %s OFFSET %s"
        return self.__montar(sql, [limite, offset])

    def buscar_por_id(self, id_denuncia):
        resultado = self.__montar(_SQL_BASE + " WHERE d.id = %s", [id_denuncia])
        return resultado[0] if resultado else None

    def contar_abertas(self):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute("SELECT COUNT(*) AS total FROM denuncias")
            return cursor.fetchone()['total']
        finally:
            cursor.close()
            conexao.close()

    def buscar_autor_alvo(self, tipo, alvo_id):
        tabela = 'postagens' if tipo == 'postagem' else 'comentarios'
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(f"SELECT autor_email FROM {tabela} WHERE id = %s", (alvo_id,))
            linha = cursor.fetchone()
            return linha['autor_email'] if linha else None
        finally:
            cursor.close()
            conexao.close()

    def cadastrar(self, tipo, alvo_id, denunciante_email, motivo, descricao):
        postagem_id = alvo_id if tipo == 'postagem' else None
        comentario_id = alvo_id if tipo == 'comentario' else None
        sql = """
            INSERT INTO denuncias (tipo, postagem_id, comentario_id, denunciante_email, motivo, descricao)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (tipo, postagem_id, comentario_id, denunciante_email, motivo, descricao))
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def excluir(self, id_denuncia):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute("DELETE FROM denuncias WHERE id = %s", (id_denuncia,))
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()