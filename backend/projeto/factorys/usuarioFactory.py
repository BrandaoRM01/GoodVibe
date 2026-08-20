from projeto.models import User, Admin, Superadmin

class UsuarioFactory:
    
    @staticmethod
    def criar_usuario(email, username, senha_hash=None, url_foto=None, token_recuperacao=None, token_expiracao=None, tipo_usuario='user', qtd_seguidores=0, qtd_seguindo=0, descricao_perfil=None, data_entrada=None, url_capa=None, localizacao=None):
        if tipo_usuario == 'admin':
            return Admin(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao,
                         qtd_seguidores, qtd_seguindo, descricao_perfil, data_entrada, url_capa, localizacao)
        elif tipo_usuario == 'superadmin':
            return Superadmin(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao, qtd_seguidores, qtd_seguindo, descricao_perfil, data_entrada, url_capa, localizacao)
        else:
            return User(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao, qtd_seguidores, qtd_seguindo, descricao_perfil, data_entrada, url_capa, localizacao)