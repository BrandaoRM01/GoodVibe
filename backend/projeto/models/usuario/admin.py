from . import Usuario

class Admin(Usuario):

    def __init__(self, email, username, senha_hash=None, url_foto=None, token_recuperacao=None, token_expiracao=None):
       super().__init__(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao)

    def tipo_usuario(self):
        return 'admin'
    
    def pode_moderar(self):
        return True
    
    def pode_gerenciar_usuarios(self):
        return False

    def to_dict(self):
        return {
            'email': self.email,
            'senha_hash': self.senha_hash,
            'url_foto': self.url_foto,
            'username': self.username,
            'tipo_usuario': self.tipo_usuario(),
            'token_recuperacao': self.token_recuperacao,
            'token_expiracao': self.token_expiracao,
            'pode_moderar': self.pode_moderar(),
            'pode_gerenciar_usuarios': self.pode_gerenciar_usuarios()
        }