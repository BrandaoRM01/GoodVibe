from . import BaseDAO

_SQL_BASE = """
    SELECT
        n.id, n.tipo, n.lida, n.qtd, n.criado_em, n.conversa_id, n.denuncia_id,
        a.email AS autor_email, a.username AS autor_username, a.url_foto AS autor_url_foto
    FROM notificacoes n
    LEFT JOIN usuarios a ON a.email = n.autor_email
"""

class NotificacaoDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def __serializar(self, linha):
        autor = None
        if linha['autor_email']:
            autor = {
                'email': linha['autor_email'],
                'username': linha['autor_username'],
                'url_foto': linha['autor_url_foto'],
            }
        return {
            'id': linha['id'],
            'tipo': linha['tipo'],
            'lida': bool(linha['lida']),
            'qtd': linha['qtd'],
            'criadoEm': self.iso_utc(linha['criado_em']),
            'conversaId': linha['conversa_id'],
            'denunciaId': linha['denuncia_id'],
            'autor': autor,
        }

    def __consultar(self, sql, valores=None):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores or [])
            return [self.__serializar(linha) for linha in cursor.fetchall()]
        finally:
            cursor.close()
            conexao.close()

    def buscar_por_id(self, id_notificacao):
        resultado = self.__consultar(_SQL_BASE + " WHERE n.id = %s", [id_notificacao])
        return resultado[0] if resultado else None

    def __registrar(self, sql, valores):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            id_notificacao = cursor.lastrowid
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()
        return self.buscar_por_id(id_notificacao)

    def registrar_seguidor(self, seguidor_email, seguido_email):
        sql = """
            INSERT INTO notificacoes (destinatario_email, tipo, autor_email, chave, criado_em)
            VALUES (%s, 'seguidor', %s, %s, UTC_TIMESTAMP(3))
            ON DUPLICATE KEY UPDATE lida = 0, criado_em = UTC_TIMESTAMP(3), id = LAST_INSERT_ID(id)
        """
        chave = f"s:{seguidor_email.lower()}:{seguido_email.lower()}"
        return self.__registrar(sql, (seguido_email, seguidor_email, chave))

    def registrar_mensagem(self, destinatario_email, remetente_email, conversa_id):
        sql = """
            INSERT INTO notificacoes (destinatario_email, tipo, autor_email, conversa_id, chave, criado_em)
            VALUES (%s, 'mensagem', %s, %s, %s, UTC_TIMESTAMP(3))
            ON DUPLICATE KEY UPDATE
                qtd = qtd + 1, lida = 0, criado_em = UTC_TIMESTAMP(3), id = LAST_INSERT_ID(id)
        """
        chave = f"m:{conversa_id}:{destinatario_email.lower()}"
        return self.__registrar(sql, (destinatario_email, remetente_email, conversa_id, chave))

    def registrar_denuncia(self, denunciante_email, tipo, alvo_id):
        """Cria uma notificação por administrador. Retorna [(email_admin, notificacao)]."""
        coluna = 'postagem_id' if tipo == 'postagem' else 'comentario_id'

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        criadas = []
        try:
            cursor.execute(
                f"SELECT id FROM denuncias WHERE denunciante_email = %s AND {coluna} = %s",
                (denunciante_email, alvo_id)
            )
            linha = cursor.fetchone()
            if not linha:
                return []
            denuncia_id = linha['id']

            cursor.execute(
                "SELECT email FROM usuarios WHERE tipo_usuario IN ('admin', 'superadmin') AND email <> %s",
                (denunciante_email,)
            )
            admins = [l['email'] for l in cursor.fetchall()]

            for admin in admins:
                cursor.execute(
                    """
                    INSERT INTO notificacoes
                        (destinatario_email, tipo, autor_email, denuncia_id, chave, criado_em)
                    VALUES (%s, 'denuncia', %s, %s, %s, UTC_TIMESTAMP(3))
                    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
                    """,
                    (admin, denunciante_email, denuncia_id, f"d:{denuncia_id}:{admin.lower()}")
                )
                criadas.append((admin, cursor.lastrowid))

            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

        return [(admin, self.buscar_por_id(id_notificacao)) for admin, id_notificacao in criadas]

    def listar(self, email, incluir_denuncias, limite, offset):
        filtro = "" if incluir_denuncias else " AND n.tipo <> 'denuncia'"
        sql = (
            _SQL_BASE
            + " WHERE n.destinatario_email = %s" + filtro
            + " ORDER BY n.criado_em DESC, n.id DESC LIMIT %s OFFSET %s"
        )
        return self.__consultar(sql, [email, limite, offset])

    def contar_nao_lidas(self, email, incluir_denuncias):
        filtro = "" if incluir_denuncias else " AND tipo <> 'denuncia'"
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "SELECT COUNT(*) FROM notificacoes WHERE destinatario_email = %s AND lida = 0" + filtro,
                (email,)
            )
            return int(cursor.fetchone()[0])
        finally:
            cursor.close()
            conexao.close()

    def marcar_lida(self, id_notificacao, email):
        """Retorna False se a notificação não existir ou não pertencer ao usuário."""
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "SELECT 1 FROM notificacoes WHERE id = %s AND destinatario_email = %s",
                (id_notificacao, email)
            )
            if cursor.fetchone() is None:
                return False

            cursor.execute(
                """
                UPDATE notificacoes
                SET lida = 1, chave = CASE WHEN tipo = 'mensagem' THEN NULL ELSE chave END
                WHERE id = %s AND destinatario_email = %s
                """,
                (id_notificacao, email)
            )
            conexao.commit()
            return True
        finally:
            cursor.close()
            conexao.close()

    def marcar_todas_lidas(self, email, incluir_denuncias):
        filtro = "" if incluir_denuncias else " AND tipo <> 'denuncia'"
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                """
                UPDATE notificacoes
                SET lida = 1, chave = CASE WHEN tipo = 'mensagem' THEN NULL ELSE chave END
                WHERE destinatario_email = %s AND lida = 0
                """ + filtro,
                (email,)
            )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def excluir(self, id_notificacao, email):
        """Retorna False se a notificação não existir ou não pertencer ao usuário."""
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "DELETE FROM notificacoes WHERE id = %s AND destinatario_email = %s",
                (id_notificacao, email)
            )
            apagadas = cursor.rowcount
            conexao.commit()
            return apagadas > 0
        finally:
            cursor.close()
            conexao.close()

    def excluir_todas(self, email, incluir_denuncias):
        filtro = "" if incluir_denuncias else " AND tipo <> 'denuncia'"
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "DELETE FROM notificacoes WHERE destinatario_email = %s" + filtro,
                (email,)
            )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()