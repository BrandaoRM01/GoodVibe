import unicodedata

from . import BaseDAO

PONTUACAO_MINIMA = 5.0

def _sem_acento(texto):
    return ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')

def _escapar_like(termo):
    return termo.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

def _resumir(conteudo, limite=140):
    texto = ' '.join((conteudo or '').split())
    return texto if len(texto) <= limite else texto[:limite - 1].rstrip() + '…'

class AssistenteDAO(BaseDAO):

    def buscar_perfis_relevantes(self, termos, email_usuario, limite=5):
        if not termos:
            return []

        padroes = []
        for termo in termos:
            for variante in termo['variantes']:
                padroes.append(f"%{_escapar_like(variante)}%")

        cond_tags = " OR ".join(["t.nome LIKE %s"] * len(padroes))
        cond_texto = " OR ".join(["p.conteudo LIKE %s OR p.boa_acao LIKE %s"] * len(padroes))
        valores_texto = []
        for padrao in padroes:
            valores_texto.extend([padrao, padrao])

        sql_tags = f"""
            SELECT p.autor_email, p.id AS postagem_id, p.conteudo, t.nome AS tag
            FROM postagens p
            INNER JOIN postagens_tags pt ON pt.postagem_id = p.id
            INNER JOIN tags t ON t.id = pt.tag_id
            WHERE p.status = 'aprovado' AND p.autor_email <> %s AND ({cond_tags})
            ORDER BY p.criado_em DESC
            LIMIT 400
        """
        sql_texto = f"""
            SELECT p.autor_email, p.id AS postagem_id, p.conteudo, p.boa_acao
            FROM postagens p
            WHERE p.status = 'aprovado' AND p.autor_email <> %s AND ({cond_texto})
            ORDER BY p.criado_em DESC
            LIMIT 300
        """

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql_tags, [email_usuario] + padroes)
            linhas_tags = cursor.fetchall()
            cursor.execute(sql_texto, [email_usuario] + valores_texto)
            linhas_texto = cursor.fetchall()

            candidatos = self.__pontuar(termos, linhas_tags, linhas_texto)[:limite]
            if not candidatos:
                return []

            emails = [c['email'] for c in candidatos]
            marcadores = ', '.join(['%s'] * len(emails))
            cursor.execute(
                f"SELECT email, username, url_foto FROM usuarios WHERE email IN ({marcadores})",
                emails,
            )
            usuarios = {u['email']: u for u in cursor.fetchall()}
        finally:
            cursor.close()
            conexao.close()

        resultado = []
        for c in candidatos:
            usuario = usuarios.get(c['email'])
            if not usuario:
                continue
            c['username'] = usuario['username']
            c['url_foto'] = usuario['url_foto']
            resultado.append(c)
        return resultado

    def __grupos_encontrados(self, termos, texto):
        base = _sem_acento((texto or '').lower())
        return {t['chave'] for t in termos if t['chave'] in base}

    def __pontuar(self, termos, linhas_tags, linhas_texto):
        perfis = {}

        def perfil(email):
            if email not in perfis:
                perfis[email] = {
                    'tags': {}, 'posts_tag': set(), 'posts_texto': set(),
                    'grupos': set(), 'trecho': None, 'trecho_id': 0, 'ultimo_id': 0,
                }
            return perfis[email]

        def registrar_trecho(p, postagem_id, conteudo):
            if postagem_id > p['trecho_id']:
                p['trecho_id'] = postagem_id
                p['trecho'] = _resumir(conteudo)

        for linha in linhas_tags:
            grupos = self.__grupos_encontrados(termos, linha['tag'])
            if not grupos:
                continue
            p = perfil(linha['autor_email'])
            p['tags'].setdefault(linha['tag'], set()).update(grupos)
            p['posts_tag'].add(linha['postagem_id'])
            p['grupos'].update(grupos)
            p['ultimo_id'] = max(p['ultimo_id'], linha['postagem_id'])
            registrar_trecho(p, linha['postagem_id'], linha['conteudo'])

        for linha in linhas_texto:
            grupos = self.__grupos_encontrados(termos, f"{linha['conteudo']} {linha['boa_acao'] or ''}")
            if not grupos:
                continue
            p = perfil(linha['autor_email'])
            p['posts_texto'].add(linha['postagem_id'])
            p['grupos'].update(grupos)
            p['ultimo_id'] = max(p['ultimo_id'], linha['postagem_id'])
            registrar_trecho(p, linha['postagem_id'], linha['conteudo'])

        candidatos = []
        for email, p in perfis.items():
            pontuacao = (
                3.0 * min(len(p['tags']), 3)
                + 1.5 * min(len(p['posts_texto']), 3)
                + 2.0 * len(p['grupos'])
                + 0.5 * min(len(p['posts_tag']), 4)
            )
            if pontuacao < PONTUACAO_MINIMA:
                continue
            candidatos.append({
                'email': email,
                'tags': list(p['tags'].keys())[:3],
                'trecho': p['trecho'],
                'pontuacao': pontuacao,
                'ultimo_id': p['ultimo_id'],
            })

        candidatos.sort(key=lambda c: (-c['pontuacao'], -c['ultimo_id']))
        return candidatos

    def buscar_perfis_populares(self, email_usuario, termos=None, limite=3):
        padroes = []
        for termo in termos or []:
            for variante in termo['variantes']:
                padroes.append(f"%{_escapar_like(variante)}%")

        if padroes:
            cond_afinidade = " OR ".join(["t.nome LIKE %s"] * len(padroes))
            coluna_afinidade = f"COUNT(DISTINCT CASE WHEN ({cond_afinidade}) THEN p.id END)"
        else:
            coluna_afinidade = "0"

        sql = f"""
            SELECT u.email, u.username, u.url_foto,
                   COUNT(DISTINCT p.id) AS total,
                   {coluna_afinidade} AS afinidade
            FROM usuarios u
            INNER JOIN postagens p ON p.autor_email = u.email AND p.status = 'aprovado'
            LEFT JOIN postagens_tags pt ON pt.postagem_id = p.id
            LEFT JOIN tags t ON t.id = pt.tag_id
            WHERE u.email <> %s
            GROUP BY u.email, u.username, u.url_foto
            ORDER BY afinidade DESC, total DESC, u.username ASC
            LIMIT %s
        """

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, padroes + [email_usuario, limite])
            usuarios = cursor.fetchall()

            resultado = []
            for u in usuarios:
                cursor.execute(
                    """
                    SELECT t.nome
                    FROM postagens p
                    INNER JOIN postagens_tags pt ON pt.postagem_id = p.id
                    INNER JOIN tags t ON t.id = pt.tag_id
                    WHERE p.autor_email = %s AND p.status = 'aprovado'
                    GROUP BY t.nome
                    ORDER BY COUNT(*) DESC, t.nome ASC
                    LIMIT 3
                    """,
                    (u['email'],),
                )
                tags = [linha['nome'] for linha in cursor.fetchall()]

                cursor.execute(
                    """
                    SELECT conteudo FROM postagens
                    WHERE autor_email = %s AND status = 'aprovado'
                    ORDER BY criado_em DESC, id DESC
                    LIMIT 1
                    """,
                    (u['email'],),
                )
                ultima = cursor.fetchone()

                resultado.append({
                    'email': u['email'],
                    'username': u['username'],
                    'url_foto': u['url_foto'],
                    'tags': tags,
                    'trecho': _resumir(ultima['conteudo']) if ultima else None,
                })
            return resultado
        finally:
            cursor.close()
            conexao.close()

    def listar_tags(self, limite=300):
        sql = """
            SELECT t.nome
            FROM tags t
            INNER JOIN postagens_tags pt ON pt.tag_id = t.id
            INNER JOIN postagens p ON p.id = pt.postagem_id
            WHERE p.status = 'aprovado'
            GROUP BY t.id, t.nome
            ORDER BY COUNT(*) DESC, t.nome ASC
            LIMIT %s
        """
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, [limite])
            return [linha['nome'] for linha in cursor.fetchall()]
        finally:
            cursor.close()
            conexao.close()

    def buscar_perfis_por_tags(self, nomes_tags, email_usuario, limite=5):
        """Perfis que publicaram nas hashtags informadas (nomes exatos)."""
        if not nomes_tags:
            return []

        marcadores = ', '.join(['%s'] * len(nomes_tags))
        sql = f"""
            SELECT p.autor_email, p.id AS postagem_id, p.conteudo, t.nome AS tag
            FROM postagens p
            INNER JOIN postagens_tags pt ON pt.postagem_id = p.id
            INNER JOIN tags t ON t.id = pt.tag_id
            WHERE p.status = 'aprovado' AND p.autor_email <> %s AND t.nome IN ({marcadores})
            ORDER BY p.criado_em DESC
            LIMIT 400
        """

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, [email_usuario] + list(nomes_tags))
            linhas = cursor.fetchall()

            perfis = {}
            for linha in linhas:
                p = perfis.setdefault(
                    linha['autor_email'],
                    {'tags': {}, 'posts': set(), 'trecho': None, 'trecho_id': 0},
                )
                p['tags'][linha['tag']] = True
                p['posts'].add(linha['postagem_id'])
                if linha['postagem_id'] > p['trecho_id']:
                    p['trecho_id'] = linha['postagem_id']
                    p['trecho'] = _resumir(linha['conteudo'])

            candidatos = [
                {
                    'email': email,
                    'tags': list(p['tags'].keys())[:3],
                    'trecho': p['trecho'],
                    'ordem': (-len(p['tags']), -len(p['posts']), -p['trecho_id']),
                }
                for email, p in perfis.items()
            ]
            candidatos.sort(key=lambda c: c['ordem'])
            candidatos = candidatos[:limite]
            if not candidatos:
                return []

            emails = [c['email'] for c in candidatos]
            marc_emails = ', '.join(['%s'] * len(emails))
            cursor.execute(
                f"SELECT email, username, url_foto FROM usuarios WHERE email IN ({marc_emails})",
                emails,
            )
            usuarios = {u['email']: u for u in cursor.fetchall()}
        finally:
            cursor.close()
            conexao.close()

        resultado = []
        for c in candidatos:
            usuario = usuarios.get(c['email'])
            if not usuario:
                continue
            resultado.append({
                'email': c['email'],
                'tags': c['tags'],
                'trecho': c['trecho'],
                'username': usuario['username'],
                'url_foto': usuario['url_foto'],
            })
        return resultado