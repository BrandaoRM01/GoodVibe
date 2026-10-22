from mysql.connector.errors import IntegrityError
from . import BaseDAO

TAMANHO_TRECHO = 160

_SQL_MENSAGEM = """
    SELECT
        m.id, m.conversa_id, m.remetente_email, m.tipo, m.conteudo,
        m.client_id, m.lida_em, m.criado_em,
        p.id AS p_id, p.conteudo AS p_conteudo, p.url_imagem AS p_imagem,
        pu.email AS p_autor_email, pu.username AS p_autor_username, pu.url_foto AS p_autor_foto
    FROM mensagens m
    LEFT JOIN postagens p ON p.id = m.postagem_id AND p.status = 'aprovado'
    LEFT JOIN usuarios pu ON pu.email = p.autor_email
"""

_SQL_CONVERSAS = """
    SELECT
        u.email, u.username, u.url_foto,
        EXISTS(
            SELECT 1 FROM seguidores r
            WHERE r.seguidor_email = u.email AND r.seguido_email = %(eu)s
        ) AS segue_de_volta,
        EXISTS(
            SELECT 1 FROM seguidores q
            WHERE q.seguidor_email = %(eu)s AND q.seguido_email = u.email
        ) AS eu_sigo,
        c.id AS conversa_id,
        c.ultima_mensagem_em,
        lm.tipo AS lm_tipo, lm.conteudo AS lm_conteudo, lm.remetente_email AS lm_remetente,
        (
            SELECT COUNT(*) FROM mensagens x
            WHERE x.conversa_id = c.id AND x.remetente_email = u.email AND x.lida_em IS NULL
        ) AS nao_lidas
    FROM (
        SELECT seguido_email AS email
        FROM seguidores
        WHERE seguidor_email = %(eu)s
        UNION
        SELECT CASE WHEN usuario_a_email = %(eu)s THEN usuario_b_email ELSE usuario_a_email END
        FROM conversas
        WHERE (usuario_a_email = %(eu)s OR usuario_b_email = %(eu)s)
          AND ultima_mensagem_em IS NOT NULL
    ) contatos
    INNER JOIN usuarios u ON u.email = contatos.email
    LEFT JOIN conversas c
        ON (c.usuario_a_email = %(eu)s AND c.usuario_b_email = u.email)
        OR (c.usuario_a_email = u.email AND c.usuario_b_email = %(eu)s)
    LEFT JOIN mensagens lm
        ON lm.id = (SELECT MAX(y.id) FROM mensagens y WHERE y.conversa_id = c.id)
    ORDER BY segue_de_volta DESC,
             eu_sigo DESC,
             (c.ultima_mensagem_em IS NULL) ASC,
             c.ultima_mensagem_em DESC,
             lm.id DESC,
             u.username ASC
"""

def _ordenar_par(a, b):
    return tuple(sorted((a, b), key=str.lower))

class MensagemDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def __serializar(self, linha):
        mensagem = {
            'id': linha['id'],
            'conversaId': linha['conversa_id'],
            'remetenteEmail': linha['remetente_email'],
            'tipo': linha['tipo'],
            'conteudo': linha['conteudo'],
            'clientId': linha['client_id'],
            'lida': linha['lida_em'] is not None,
            'criadoEm': self.iso_utc(linha['criado_em']),
            'postagem': None,
        }

        if linha['tipo'] == 'postagem':
            if linha['p_id']:
                texto = linha['p_conteudo'] or ''
                trecho = texto[:TAMANHO_TRECHO] + ('…' if len(texto) > TAMANHO_TRECHO else '')
                mensagem['postagem'] = {
                    'disponivel': True,
                    'id': linha['p_id'],
                    'autor': linha['p_autor_username'],
                    'autorEmail': linha['p_autor_email'],
                    'autorFoto': linha['p_autor_foto'],
                    'conteudo': trecho,
                    'imagem': linha['p_imagem'],
                }
            else:
                mensagem['postagem'] = {'disponivel': False}

        return mensagem

    def __consultar(self, sql, valores=None):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores or [])
            return [self.__serializar(linha) for linha in cursor.fetchall()]
        finally:
            cursor.close()
            conexao.close()

    def __id_conversa(self, cursor, a, b):
        cursor.execute(
            """
            SELECT id FROM conversas
            WHERE (usuario_a_email = %s AND usuario_b_email = %s)
               OR (usuario_a_email = %s AND usuario_b_email = %s)
            """,
            (a, b, b, a)
        )
        linha = cursor.fetchone()
        return linha['id'] if linha else None

    def buscar_id_conversa(self, a, b):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            return self.__id_conversa(cursor, a, b)
        finally:
            cursor.close()
            conexao.close()

    def segue(self, seguidor_email, seguido_email):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "SELECT 1 FROM seguidores WHERE seguidor_email = %s AND seguido_email = %s",
                (seguidor_email, seguido_email)
            )
            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conexao.close()

    def postagem_disponivel(self, id_postagem):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "SELECT 1 FROM postagens WHERE id = %s AND status = 'aprovado'",
                (id_postagem,)
            )
            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conexao.close()

    def buscar_mensagem(self, id_mensagem):
        resultado = self.__consultar(_SQL_MENSAGEM + " WHERE m.id = %s", [id_mensagem])
        return resultado[0] if resultado else None

    def __buscar_por_client_id(self, conversa_id, remetente, client_id):
        resultado = self.__consultar(
            _SQL_MENSAGEM + " WHERE m.conversa_id = %s AND m.remetente_email = %s AND m.client_id = %s",
            [conversa_id, remetente, client_id]
        )
        return resultado[0] if resultado else None

    def enviar(self, remetente, destinatario, tipo, conteudo, postagem_id, client_id):
        """Retorna (mensagem, criada). criada=False quando o client_id já havia sido processado."""
        a, b = _ordenar_par(remetente, destinatario)

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(
                "INSERT IGNORE INTO conversas (usuario_a_email, usuario_b_email) VALUES (%s, %s)",
                (a, b)
            )
            conversa_id = self.__id_conversa(cursor, remetente, destinatario)

            try:
                cursor.execute(
                    """
                    INSERT INTO mensagens
                        (conversa_id, remetente_email, tipo, conteudo, postagem_id, client_id, criado_em)
                    VALUES (%s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(3))
                    """,
                    (conversa_id, remetente, tipo, conteudo, postagem_id, client_id)
                )
            except IntegrityError:
                conexao.rollback()
                if client_id:
                    existente = self.__buscar_por_client_id(conversa_id, remetente, client_id)
                    if existente:
                        return existente, False
                raise

            id_mensagem = cursor.lastrowid

            cursor.execute(
                """
                UPDATE conversas c
                INNER JOIN mensagens m ON m.id = %s
                SET c.ultima_mensagem_em = m.criado_em
                WHERE c.id = %s
                """,
                (id_mensagem, conversa_id)
            )

            if postagem_id:
                cursor.execute(
                    "UPDATE postagens SET total_compartilhamentos = total_compartilhamentos + 1 WHERE id = %s",
                    (postagem_id,)
                )

            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

        return self.buscar_mensagem(id_mensagem), True

    def listar_mensagens(self, conversa_id, limite, antes=None, depois=None):
        """Retorna (mensagens em ordem cronológica, proximo_antes)."""
        if depois is not None:
            sql = _SQL_MENSAGEM + " WHERE m.conversa_id = %s AND m.id > %s ORDER BY m.id ASC LIMIT 200"
            return self.__consultar(sql, [conversa_id, depois]), None

        sql = _SQL_MENSAGEM + " WHERE m.conversa_id = %s"
        valores = [conversa_id]
        if antes is not None:
            sql += " AND m.id < %s"
            valores.append(antes)
        sql += " ORDER BY m.id DESC LIMIT %s"
        valores.append(limite + 1)

        linhas = self.__consultar(sql, valores)
        tem_mais = len(linhas) > limite
        linhas = linhas[:limite]
        linhas.reverse()

        proximo_antes = linhas[0]['id'] if tem_mais and linhas else None
        return linhas, proximo_antes

    def listar_conversas(self, email):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(_SQL_CONVERSAS, {'eu': email})
            linhas = cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

        conversas = []
        for l in linhas:
            ultima = None
            if l['lm_tipo']:
                ultima = {
                    'tipo': l['lm_tipo'],
                    'conteudo': l['lm_conteudo'],
                    'remetenteEmail': l['lm_remetente'],
                }
            conversas.append({
                'usuario': {'email': l['email'], 'username': l['username'], 'url_foto': l['url_foto']},
                'segueDeVolta': bool(l['segue_de_volta']),
                'euSigo': bool(l['eu_sigo']),
                'conversaId': l['conversa_id'],
                'naoLidas': int(l['nao_lidas'] or 0),
                'ultimaAtividade': self.iso_utc(l['ultima_mensagem_em']),
                'ultimaMensagem': ultima,
            })
        return conversas

    def contar_nao_lidas(self, email):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM mensagens m
                INNER JOIN conversas c ON c.id = m.conversa_id
                WHERE (c.usuario_a_email = %s OR c.usuario_b_email = %s)
                  AND m.remetente_email <> %s
                  AND m.lida_em IS NULL
                """,
                (email, email, email)
            )
            return int(cursor.fetchone()[0])
        finally:
            cursor.close()
            conexao.close()

    def marcar_lidas(self, conversa_id, leitor_email):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                """
                UPDATE mensagens SET lida_em = UTC_TIMESTAMP(3)
                WHERE conversa_id = %s AND remetente_email <> %s AND lida_em IS NULL
                """,
                (conversa_id, leitor_email)
            )
            lidas = cursor.rowcount

            cursor.execute(
                """
                UPDATE notificacoes SET lida = 1, chave = NULL
                WHERE destinatario_email = %s AND tipo = 'mensagem'
                  AND conversa_id = %s AND lida = 0
                """,
                (leitor_email, conversa_id)
            )
            conexao.commit()
            return lidas
        finally:
            cursor.close()
            conexao.close()