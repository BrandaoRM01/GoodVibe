from projeto.factorys import PostagemFactory, TagFactory, UsuarioFactory
from . import BaseDAO

class PostagemDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def __criar_postagem(self, linha):
        autor = UsuarioFactory.criar_usuario(
            email=linha['autor_email'],
            username=linha['autor_username'],
            url_foto=linha['autor_url_foto'],
            tipo_usuario=linha['autor_tipo_usuario']
        )
        return PostagemFactory.criar_postagem(
            id=linha['id'],
            conteudo=linha['conteudo'],
            autor=autor,
            status=linha['status'],
            url_imagem=linha['url_imagem'],
            boa_acao=linha['boa_acao'],
            total_curtidas=linha['total_curtidas'],
            total_comentarios=linha['total_comentarios'],
            total_compartilhamentos=linha['total_compartilhamentos'],
            criado_em=linha['criado_em'],
        )

    def __montar_postagens(self, sql, valores=None):
        postagens_map = {}
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores or [])
            for linha in cursor.fetchall():
                pid = linha['id']
                if pid not in postagens_map:
                    postagens_map[pid] = self.__criar_postagem(linha)

                if linha['tag_id'] and not postagens_map[pid].possui_tag(linha['tag_id']):
                    tag = TagFactory.criar_tag(id=linha['tag_id'], nome=linha['tag_nome'])
                    postagens_map[pid].adicionar_tag(tag)

                if linha['curtida_usuario_email'] and not postagens_map[pid].foi_curtido_por(linha['curtida_usuario_email']):
                    postagens_map[pid].adicionar_curtida(linha['curtida_usuario_email'])
        finally:
            cursor.close()
            conexao.close()
        return list(postagens_map.values())

    def listar_feed(self, tag_nome=None, autor_username=None):
        sql = "SELECT * FROM vw_postagens WHERE status = 'aprovado'"
        valores = []

        if tag_nome:
            sql += """
                AND id IN (
                    SELECT pt.postagem_id
                    FROM postagens_tags pt
                    INNER JOIN tags t ON t.id = pt.tag_id
                    WHERE t.nome = %s
                )
            """
            valores.append(tag_nome)

        if autor_username:
            sql += " AND autor_username = %s"
            valores.append(autor_username)

        sql += " ORDER BY criado_em DESC"
        return self.__montar_postagens(sql, valores)

    def buscar_tags_tendencias(self, limite=4):
        sql = """
            SELECT t.id, t.nome, COUNT(*) AS totalPostagens
            FROM tags t
            INNER JOIN postagens_tags pt ON pt.tag_id = t.id
            INNER JOIN postagens p ON p.id = pt.postagem_id
            WHERE p.status = 'aprovado'
            GROUP BY t.id, t.nome
            ORDER BY totalPostagens DESC
            LIMIT %s
        """
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, [limite])
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

    def listar_todas(self):
        sql = "SELECT * FROM vw_postagens ORDER BY status DESC, criado_em DESC"
        return self.__montar_postagens(sql)

    def buscar_por_id(self, id_postagem):
        sql = "SELECT * FROM vw_postagens WHERE id = %s"
        resultado = self.__montar_postagens(sql, [id_postagem])
        return resultado[0] if resultado else None

    def cadastrar_postagem(self, nova_postagem, tags_nomes):
        sql = """
            INSERT INTO postagens (conteudo, url_imagem, boa_acao, autor_email, status)
            VALUES (%s, %s, %s, %s, %s)
        """
        valores = [
            nova_postagem.conteudo, nova_postagem.url_imagem, nova_postagem.boa_acao,
            nova_postagem.autor.email, nova_postagem.status
        ]

        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            nova_postagem.id = cursor.lastrowid
            self.__salvar_tags_postagem(cursor, nova_postagem.id, tags_nomes)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def atualizar_postagem(self, id_postagem, conteudo, url_imagem, boa_acao, tags_nomes):
        sql = "UPDATE postagens SET conteudo = %s, url_imagem = %s, boa_acao = %s WHERE id = %s"
        valores = [conteudo, url_imagem, boa_acao, id_postagem]

        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            cursor.execute("DELETE FROM postagens_tags WHERE postagem_id = %s", (id_postagem,))
            self.__salvar_tags_postagem(cursor, id_postagem, tags_nomes)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def buscar_sugestoes_tags(self, termo, limite=8):
        sql = "SELECT id, nome FROM tags WHERE nome LIKE %s ORDER BY nome ASC LIMIT %s"
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, [f"%{termo}%", limite])
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

    def __salvar_tags_postagem(self, cursor, id_postagem, tags_nomes):
        for nome in tags_nomes:
            cursor.execute(
                """
                INSERT INTO tags (nome) VALUES (%s)
                ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
                """,
                (nome,)
            )
            tag_id = cursor.lastrowid
            cursor.execute(
                "INSERT IGNORE INTO postagens_tags (postagem_id, tag_id) VALUES (%s, %s)",
                (id_postagem, tag_id)
            )

    def curtir_postagem(self, id_postagem, email_usuario):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "INSERT IGNORE INTO curtidas (postagem_id, usuario_email) VALUES (%s, %s)",
                (id_postagem, email_usuario)
            )
            if cursor.rowcount:
                cursor.execute(
                    "UPDATE postagens SET total_curtidas = total_curtidas + 1 WHERE id = %s",
                    (id_postagem,)
                )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def descurtir_postagem(self, id_postagem, email_usuario):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "DELETE FROM curtidas WHERE postagem_id = %s AND usuario_email = %s",
                (id_postagem, email_usuario)
            )
            if cursor.rowcount:
                cursor.execute(
                    "UPDATE postagens SET total_curtidas = total_curtidas - 1 WHERE id = %s",
                    (id_postagem,)
                )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def alterar_status(self, id_postagem, status):
        sql = "UPDATE postagens SET status = %s WHERE id = %s"
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (status, id_postagem))
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def excluir_postagem(self, id_postagem):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute("DELETE FROM postagens WHERE id = %s", (id_postagem,))
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()