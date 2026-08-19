from . import Usuario

class User(Usuario):

    def __init__(self, email, username, senha_hash=None, url_foto=None, token_recuperacao=None, token_expiracao=None,
                 qtd_seguidores=0, qtd_seguindo=0, qtd_conquistas=0):
       super().__init__(email, username, senha_hash, url_foto, token_recuperacao, token_expiracao,
                         qtd_seguidores, qtd_seguindo, qtd_conquistas)

    def tipo_usuario(self):
        return 'user'

    def pode_moderar(self):
        return False
    
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
            'pode_gerenciar_usuarios': self.pode_gerenciar_usuarios(),
            'qtd_seguidores': self.qtd_seguidores,
            'qtd_seguindo': self.qtd_seguindo,
            'qtd_conquistas': self.qtd_conquistas
        }