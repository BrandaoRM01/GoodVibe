from . import BaseDAO
from projeto.factorys import UsuarioFactory
from projeto.config import Config
from werkzeug.security import generate_password_hash
from datetime import date, timedelta
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
                url_foto = resultado.get('url_foto')
                if url_foto and "default" not in url_foto:
                    caminho_foto = os.path.join(Config.BASE_DIR, url_foto)
                    if os.path.exists(caminho_foto):
                        os.remove(caminho_foto)

                url_capa = resultado.get('url_capa')
                if url_capa:
                    caminho_capa = os.path.join(Config.BASE_DIR, url_capa)
                    if os.path.exists(caminho_capa):
                        os.remove(caminho_capa)

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
                url_foto = %s,
                descricao_perfil = %s,
                url_capa = %s,
                localizacao = %s
            WHERE email = %s
        '''
        valores = [
            usuario_atualizado.username,
            usuario_atualizado.senha_hash,
            usuario_atualizado.url_foto,
            usuario_atualizado.descricao_perfil,
            usuario_atualizado.url_capa,
            usuario_atualizado.localizacao,
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

    def buscar_usuarios_destaque(self, limite=3):
        sql = """
            SELECT u.email, u.username, u.url_foto, COUNT(p.id) AS totalPostagens
            FROM usuarios u
            INNER JOIN postagens p ON p.autor_email = u.email
            WHERE p.status = 'aprovado'
            GROUP BY u.email, u.username, u.url_foto
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

    def __variacao_percentual(self, atual, anterior):
        if not anterior:
            return None
        return round((atual - anterior) / anterior * 100, 1)

    def __contar_usuarios_ativos(self, cursor, dias_inicio, dias_fim):
        sql = """
            SELECT COUNT(*) AS total FROM (
                SELECT autor_email FROM postagens
                WHERE criado_em > DATE_SUB(NOW(), INTERVAL %s DAY)
                  AND criado_em <= DATE_SUB(NOW(), INTERVAL %s DAY)
                UNION
                SELECT autor_email FROM comentarios
                WHERE criado_em > DATE_SUB(NOW(), INTERVAL %s DAY)
                  AND criado_em <= DATE_SUB(NOW(), INTERVAL %s DAY)
            ) AS ativos
        """
        cursor.execute(sql, [dias_inicio, dias_fim, dias_inicio, dias_fim])
        return cursor.fetchone()['total']

    def __contar_boas_acoes_dia(self, cursor, dias_atras):
        sql = """
            SELECT COUNT(*) AS total
            FROM postagens
            WHERE status = 'aprovado'
              AND DATE(criado_em) = DATE_SUB(CURDATE(), INTERVAL %s DAY)
        """
        cursor.execute(sql, [dias_atras])
        return cursor.fetchone()['total']

    def __buscar_crescimento_mensal(self, cursor):
        nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

        hoje = date.today()
        meses = []
        ano, mes = hoje.year, hoje.month
        for _ in range(12):
            meses.append((ano, mes))
            mes -= 1
            if mes == 0:
                mes = 12
                ano -= 1
        meses.reverse()

        inicio = date(meses[0][0], meses[0][1], 1)

        cursor.execute("""
            SELECT YEAR(data_entrada) AS ano, MONTH(data_entrada) AS mes, COUNT(*) AS total
            FROM usuarios
            WHERE data_entrada >= %s
            GROUP BY YEAR(data_entrada), MONTH(data_entrada)
        """, [inicio])
        usuarios_por_mes = {(l['ano'], l['mes']): l['total'] for l in cursor.fetchall()}

        cursor.execute("""
            SELECT YEAR(criado_em) AS ano, MONTH(criado_em) AS mes, COUNT(*) AS total
            FROM postagens
            WHERE status = 'aprovado' AND criado_em >= %s
            GROUP BY YEAR(criado_em), MONTH(criado_em)
        """, [inicio])
        posts_por_mes = {(l['ano'], l['mes']): l['total'] for l in cursor.fetchall()}

        return [
            {
                'name': nomes[m - 1],
                'users': usuarios_por_mes.get((a, m), 0),
                'posts': posts_por_mes.get((a, m), 0)
            }
            for a, m in meses
        ]

    def __buscar_boas_acoes_semana(self, cursor):
        dias_semana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

        hoje = date.today()
        dias = [hoje - timedelta(days=i) for i in range(6, -1, -1)]

        cursor.execute("""
            SELECT DATE(criado_em) AS dia, COUNT(*) AS total
            FROM postagens
            WHERE status = 'aprovado' AND criado_em >= %s
            GROUP BY DATE(criado_em)
        """, [dias[0]])
        por_dia = {l['dia']: l['total'] for l in cursor.fetchall()}

        return [{'day': dias_semana[d.weekday()], 'deeds': por_dia.get(d, 0)} for d in dias]

    def __montar_filtros_usuarios(self, busca, tipo):
        filtros = []
        valores = []

        if busca:
            filtros.append("u.username LIKE %s")
            valores.append(f"%{busca}%")

        if tipo:
            filtros.append("u.tipo_usuario = %s")
            valores.append(tipo)

        where = f"WHERE {' AND '.join(filtros)}" if filtros else ""
        return where, valores

    def __consultar_ranking(self, cursor, limite, offset, where="", valores=None):
        sql = f"""
            SELECT u.email, u.username, u.url_foto, u.tipo_usuario,
                   COUNT(p.id) AS totalPostagens
            FROM usuarios u
            LEFT JOIN postagens p ON p.autor_email = u.email AND p.status = 'aprovado'
            {where}
            GROUP BY u.email, u.username, u.url_foto, u.tipo_usuario
            ORDER BY totalPostagens DESC, u.username ASC
            LIMIT %s OFFSET %s
        """
        cursor.execute(sql, (valores or []) + [limite, offset])
        return cursor.fetchall()

    def buscar_resumo_admin(self, limite_destaques=5):
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute("SELECT COUNT(*) AS total FROM usuarios")
            total_usuarios = cursor.fetchone()['total']

            ativos_atual = self.__contar_usuarios_ativos(cursor, 30, 0)
            ativos_anterior = self.__contar_usuarios_ativos(cursor, 60, 30)

            boas_acoes_hoje = self.__contar_boas_acoes_dia(cursor, 0)
            boas_acoes_ontem = self.__contar_boas_acoes_dia(cursor, 1)

            engajamento = round(ativos_atual / total_usuarios * 100) if total_usuarios else 0

            return {
                'totalUsuarios': total_usuarios,
                'kpis': {
                    'usuariosAtivos': {
                        'valor': ativos_atual,
                        'variacao': self.__variacao_percentual(ativos_atual, ativos_anterior)
                    },
                    'boasAcoesHoje': {
                        'valor': boas_acoes_hoje,
                        'variacao': self.__variacao_percentual(boas_acoes_hoje, boas_acoes_ontem)
                    },
                    'engajamento': {
                        'valor': engajamento
                    }
                },
                'crescimento': self.__buscar_crescimento_mensal(cursor),
                'boasAcoesSemana': self.__buscar_boas_acoes_semana(cursor),
                'destaques': self.__consultar_ranking(cursor, limite_destaques, 0)
            }
        finally:
            cursor.close()
            conexao.close()

    def listar_ranking_usuarios(self, busca=None, tipo=None, limite=20, offset=0):
        where, valores = self.__montar_filtros_usuarios(busca, tipo)

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(f"SELECT COUNT(*) AS total FROM usuarios u {where}", valores)
            total = cursor.fetchone()['total']

            usuarios = self.__consultar_ranking(cursor, limite, offset, where, valores)
        finally:
            cursor.close()
            conexao.close()

        return usuarios, total