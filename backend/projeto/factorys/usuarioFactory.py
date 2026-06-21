from projeto.models import User, Admin, Superadmin

class UsuarioFactory:
    
    @staticmethod
    def criar_usuario(email, username, senha_hash=None, url_foto=None, token_recuperacao=None, token_expiracao=None, tipo_usuario='user'):
        if tipo_usuario == 'admin':
            return Admin(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao)
        elif tipo_usuario == 'superadmin':
            return Superadmin(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao)
        else:
            return User(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao)