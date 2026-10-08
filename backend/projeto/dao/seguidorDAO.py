from . import BaseDAO

class SeguidorDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def seguir(self, seguidor_email, seguido_email):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "INSERT IGNORE INTO seguidores (seguidor_email, seguido_email) VALUES (%s, %s)",
                (seguidor_email, seguido_email)
            )
            novo = cursor.rowcount > 0
            if novo:
                cursor.execute(
                    "UPDATE usuarios SET qtd_seguindo = qtd_seguindo + 1 WHERE email = %s",
                    (seguidor_email,)
                )
                cursor.execute(
                    "UPDATE usuarios SET qtd_seguidores = qtd_seguidores + 1 WHERE email = %s",
                    (seguido_email,)
                )
            conexao.commit()
            return novo
        finally:
            cursor.close()
            conexao.close()

    def deixar_de_seguir(self, seguidor_email, seguido_email):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "DELETE FROM seguidores WHERE seguidor_email = %s AND seguido_email = %s",
                (seguidor_email, seguido_email)
            )
            removido = cursor.rowcount > 0
            if removido:
                cursor.execute(
                    "UPDATE usuarios SET qtd_seguindo = GREATEST(CAST(qtd_seguindo AS SIGNED) - 1, 0) WHERE email = %s",
                    (seguidor_email,)
                )
                cursor.execute(
                    "UPDATE usuarios SET qtd_seguidores = GREATEST(CAST(qtd_seguidores AS SIGNED) - 1, 0) WHERE email = %s",
                    (seguido_email,)
                )
            conexao.commit()
            return removido
        finally:
            cursor.close()
            conexao.close()

    def buscar_contagens(self, email):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT qtd_seguidores, qtd_seguindo FROM usuarios WHERE email = %s",
                (email,)
            )
            return cursor.fetchone() or {'qtd_seguidores': 0, 'qtd_seguindo': 0}
        finally:
            cursor.close()
            conexao.close()

    def emails_seguindo(self, email):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "SELECT seguido_email FROM seguidores WHERE seguidor_email = %s",
                (email,)
            )
            return [linha[0] for linha in cursor.fetchall()]
        finally:
            cursor.close()
            conexao.close()

    def emails_conhecidos(self, email):
        """Quem as pessoas que eu sigo seguem (amigos de amigos)."""
        sql = """
            SELECT DISTINCT s2.seguido_email
            FROM seguidores s1
            INNER JOIN seguidores s2 ON s2.seguidor_email = s1.seguido_email
            WHERE s1.seguidor_email = %s
        """
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (email,))
            return {linha[0] for linha in cursor.fetchall()}
        finally:
            cursor.close()
            conexao.close()

    def listar_rede(self, email_alvo, tipo, email_logado, busca, ordem, limite, offset):
        # tipo 'seguidores' = quem segue o alvo | 'seguindo' = quem o alvo segue
        if tipo == 'seguidores':
            coluna_usuario, coluna_alvo = 's.seguidor_email', 's.seguido_email'
        else:
            coluna_usuario, coluna_alvo = 's.seguido_email', 's.seguidor_email'

        direcao = 'ASC' if ordem == 'antigos' else 'DESC'

        where = f"WHERE {coluna_alvo} = %s"
        valores_where = [email_alvo]

        if busca:
            escapado = busca.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            where += " AND u.username LIKE %s"
            valores_where.append(f"%{escapado}%")

        sql_total = f"""
            SELECT COUNT(*) AS total
            FROM seguidores s
            INNER JOIN usuarios u ON u.email = {coluna_usuario}
            {where}
        """
        sql_lista = f"""
            SELECT u.email, u.username, u.url_foto, s.criado_em AS seguidoEm,
                   EXISTS(
                       SELECT 1 FROM seguidores x
                       WHERE x.seguidor_email = %s AND x.seguido_email = u.email
                   ) AS euSigo
            FROM seguidores s
            INNER JOIN usuarios u ON u.email = {coluna_usuario}
            {where}
            ORDER BY s.criado_em {direcao}, u.username ASC
            LIMIT %s OFFSET %s
        """

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql_total, valores_where)
            total = cursor.fetchone()['total']

            cursor.execute(sql_lista, [email_logado] + valores_where + [limite, offset])
            usuarios = cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

        for u in usuarios:
            u['seguidoEm'] = u['seguidoEm'].isoformat() if u['seguidoEm'] else None
            u['euSigo'] = bool(u['euSigo'])

        return usuarios, total