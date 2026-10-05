class Comentario:

    def __init__(self, postagem_id, autor, conteudo, id=None, comentario_pai_id=None, profundidade=0,
                 total_curtidas=0, total_respostas=0, criado_em=None, editado_em=None,
                 curtido_por_mim=False):
        self.__id = id
        self.__postagem_id = postagem_id
        self.__autor = autor
        self.__conteudo = conteudo
        self.__comentario_pai_id = comentario_pai_id
        self.__profundidade = profundidade
        self.__total_curtidas = total_curtidas
        self.__total_respostas = total_respostas
        self.__criado_em = criado_em
        self.__editado_em = editado_em
        self.__curtido_por_mim = curtido_por_mim

    @property
    def id(self): return self.__id
    @property
    def postagem_id(self): return self.__postagem_id
    @property
    def autor(self): return self.__autor
    @property
    def conteudo(self): return self.__conteudo
    @property
    def comentario_pai_id(self): return self.__comentario_pai_id
    @property
    def profundidade(self): return self.__profundidade
    @property
    def total_curtidas(self): return self.__total_curtidas
    @property
    def total_respostas(self): return self.__total_respostas
    @property
    def criado_em(self): return self.__criado_em
    @property
    def editado_em(self): return self.__editado_em
    @property
    def curtido_por_mim(self): return self.__curtido_por_mim

    @id.setter
    def id(self, valor): self.__id = valor
    @conteudo.setter
    def conteudo(self, valor): self.__conteudo = valor
    @total_curtidas.setter
    def total_curtidas(self, valor): self.__total_curtidas = valor
    @total_respostas.setter
    def total_respostas(self, valor): self.__total_respostas = valor

    def to_dict(self):
        return {
            "id": self.__id,
            "postagemId": self.__postagem_id,
            "parentId": self.__comentario_pai_id,
            "author": self.__autor.username,
            "handle": f"@{self.__autor.username}",
            "authorEmail": self.__autor.email,
            "avatarUrl": self.__autor.url_foto,
            "time": self.__criado_em.isoformat() if self.__criado_em else None,
            "content": self.__conteudo,
            "likes": self.__total_curtidas,
            "replies": self.__total_respostas,
            "depth": self.__profundidade,
            "edited": self.__editado_em is not None,
            "curtidoPorMim": bool(self.__curtido_por_mim),
        }
