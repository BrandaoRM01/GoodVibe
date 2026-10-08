class Denuncia:

    def __init__(self, id, tipo, motivo, descricao, criado_em,
                 denunciante_email, denunciante_username, denunciante_url_foto,
                 postagem_id=None, comentario_id=None,
                 alvo_conteudo=None, alvo_imagem=None,
                 alvo_autor_email=None, alvo_autor_username=None, alvo_postagem_id=None):
        self.__id = id
        self.__tipo = tipo
        self.__motivo = motivo
        self.__descricao = descricao
        self.__criado_em = criado_em
        self.__denunciante_email = denunciante_email
        self.__denunciante_username = denunciante_username
        self.__denunciante_url_foto = denunciante_url_foto
        self.__postagem_id = postagem_id
        self.__comentario_id = comentario_id
        self.__alvo_conteudo = alvo_conteudo
        self.__alvo_imagem = alvo_imagem
        self.__alvo_autor_email = alvo_autor_email
        self.__alvo_autor_username = alvo_autor_username
        self.__alvo_postagem_id = alvo_postagem_id

    @property
    def id(self): return self.__id
    @property
    def tipo(self): return self.__tipo
    @property
    def alvo_id(self):
        return self.__postagem_id if self.__tipo == 'postagem' else self.__comentario_id

    def to_dict(self, rotulo_motivo=None):
        return {
            "id": self.__id,
            "tipo": self.__tipo,
            "motivo": self.__motivo,
            "motivoRotulo": rotulo_motivo or self.__motivo,
            "descricao": self.__descricao,
            "time": self.__criado_em.isoformat() if self.__criado_em else None,
            "denunciante": {
                "email": self.__denunciante_email,
                "username": self.__denunciante_username,
                "urlFoto": self.__denunciante_url_foto,
            },
            "alvo": {
                "id": self.alvo_id,
                "postagemId": self.__alvo_postagem_id,
                "conteudo": self.__alvo_conteudo,
                "imagem": self.__alvo_imagem,
                "autorEmail": self.__alvo_autor_email,
                "autorUsername": self.__alvo_autor_username,
            },
        }