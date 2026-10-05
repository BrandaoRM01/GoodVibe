from projeto.factorys import ComentarioFactory, UsuarioFactory
from . import BaseDAO

_SQL_BASE = """
    SELECT
        c.id, c.postagem_id, c.autor_email, c.comentario_pai_id, c.conteudo, c.profundidade,
        c.total_curtidas, c.total_respostas, c.criado_em, c.editado_em,
        u.username AS autor_username,
        u.url_foto AS autor_url_foto,
        u.tipo_usuario AS autor_tipo_usuario,
        EXISTS(
            SELECT 1 FROM curtidas_comentarios cc
            WHERE cc.comentario_id = c.id AND cc.usuario_email = %s
        ) AS curtido_por_mim
    FROM comentarios c
    INNER JOIN usuarios u ON u.email = c.autor_email
"""

class ComentarioDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def __criar_comentario(self, linha):
        autor = UsuarioFactory.criar_usuario(
            email=linha['autor_email'],
            username=linha['autor_username'],
            url_foto=linha['autor_url_foto'],
            tipo_usuario=linha['autor_tipo_usuario']
        )
        return ComentarioFactory.criar_comentario(
            id=linha['id'],
            postagem_id=linha['postagem_id'],
            autor=autor,
            conteudo=linha['conteudo'],
            comentario_pai_id=linha['comentario_pai_id'],
            profundidade=linha['profundidade'],
            total_curtidas=linha['total_curtidas'],
            total_respostas=linha['total_respostas'],
            criado_em=linha['criado_em'],
            editado_em=linha['editado_em'],
            curtido_por_mim=bool(linha['curtido_por_mim']),
        )

    def __montar_comentarios(self, sql, valores):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores)
            return [self.__criar_comentario(linha) for linha in cursor.fetchall()]
        finally:
            cursor.close()
            conexao.close()

    def buscar_resumo_postagem(self, postagem_id):
        sql = "SELECT id, status, autor_email FROM postagens WHERE id = %s"
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, (postagem_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conexao.close()

    def listar_raiz(self, postagem_id, email_usuario, limite, offset):
        sql = _SQL_BASE + """
            WHERE c.postagem_id = %s AND c.comentario_pai_id IS NULL
            ORDER BY c.criado_em DESC, c.id DESC
            LIMIT %s OFFSET %s
        """
        return self.__montar_comentarios(sql, [email_usuario, postagem_id, limite, offset])

    def listar_respostas(self, comentario_pai_id, email_usuario, limite, offset):
        sql = _SQL_BASE + """
            WHERE c.comentario_pai_id = %s
            ORDER BY c.criado_em ASC, c.id ASC
            LIMIT %s OFFSET %s
        """
        return self.__montar_comentarios(sql, [email_usuario, comentario_pai_id, limite, offset])

    def buscar_por_id(self, id_comentario, email_usuario=None):
        sql = _SQL_BASE + " WHERE c.id = %s"
        resultado = self.__montar_comentarios(sql, [email_usuario, id_comentario])
        return resultado[0] if resultado else None

    def total_comentarios_postagem(self, postagem_id):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute("SELECT total_comentarios FROM postagens WHERE id = %s", (postagem_id,))
            linha = cursor.fetchone()
            return linha['total_comentarios'] if linha else 0
        finally:
            cursor.close()
            conexao.close()

    def cadastrar_comentario(self, novo_comentario):
        sql = """
            INSERT INTO comentarios (postagem_id, autor_email, comentario_pai_id, conteudo, profundidade)
            VALUES (%s, %s, %s, %s, %s)
        """
        valores = [
            novo_comentario.postagem_id, novo_comentario.autor.email,
            novo_comentario.comentario_pai_id, novo_comentario.conteudo, novo_comentario.profundidade
        ]

        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            novo_comentario.id = cursor.lastrowid

            cursor.execute(
                "UPDATE postagens SET total_comentarios = total_comentarios + 1 WHERE id = %s",
                (novo_comentario.postagem_id,)
            )
            if novo_comentario.comentario_pai_id:
                cursor.execute(
                    "UPDATE comentarios SET total_respostas = total_respostas + 1 WHERE id = %s",
                    (novo_comentario.comentario_pai_id,)
                )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def atualizar_comentario(self, id_comentario, conteudo):
        sql = "UPDATE comentarios SET conteudo = %s, editado_em = NOW() WHERE id = %s"
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (conteudo, id_comentario))
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def excluir_comentario(self, comentario):
        # As respostas (e as curtidas) são removidas em cascata pelo banco.
        # Por isso o total da postagem é recalculado em vez de apenas subtrair 1.
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute("DELETE FROM comentarios WHERE id = %s", (comentario.id,))
            if cursor.rowcount:
                if comentario.comentario_pai_id:
                    cursor.execute(
                        "UPDATE comentarios SET total_respostas = GREATEST(total_respostas - 1, 0) WHERE id = %s",
                        (comentario.comentario_pai_id,)
                    )
                cursor.execute(
                    """
                    UPDATE postagens
                    SET total_comentarios = (SELECT COUNT(*) FROM comentarios WHERE postagem_id = %s)
                    WHERE id = %s
                    """,
                    (comentario.postagem_id, comentario.postagem_id)
                )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def curtir_comentario(self, id_comentario, email_usuario):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "INSERT IGNORE INTO curtidas_comentarios (comentario_id, usuario_email) VALUES (%s, %s)",
                (id_comentario, email_usuario)
            )
            if cursor.rowcount:
                cursor.execute(
                    "UPDATE comentarios SET total_curtidas = total_curtidas + 1 WHERE id = %s",
                    (id_comentario,)
                )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def descurtir_comentario(self, id_comentario, email_usuario):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "DELETE FROM curtidas_comentarios WHERE comentario_id = %s AND usuario_email = %s",
                (id_comentario, email_usuario)
            )
            if cursor.rowcount:
                cursor.execute(
                    "UPDATE comentarios SET total_curtidas = GREATEST(total_curtidas - 1, 0) WHERE id = %s",
                    (id_comentario,)
                )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()
