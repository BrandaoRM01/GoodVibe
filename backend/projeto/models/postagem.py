class Postagem:

    def __init__(self, conteudo, autor, status='aprovado', id=None, url_imagem=None,
                 boa_acao=None, total_curtidas=0, total_comentarios=0, total_compartilhamentos=0,
                 criado_em=None, tags=None, curtidas=None):
        self.__id = id
        self.__conteudo = conteudo
        self.__autor = autor         
        self.__status = status
        self.__url_imagem = url_imagem
        self.__boa_acao = boa_acao
        self.__total_curtidas = total_curtidas
        self.__total_comentarios = total_comentarios
        self.__total_compartilhamentos = total_compartilhamentos
        self.__criado_em = criado_em
        self.__tags = tags if tags is not None else []
        self.__curtidas = curtidas if curtidas is not None else []   

    @property
    def id(self): return self.__id
    @property
    def conteudo(self): return self.__conteudo
    @property
    def autor(self): return self.__autor
    @property
    def status(self): return self.__status
    @property
    def url_imagem(self): return self.__url_imagem
    @property
    def boa_acao(self): return self.__boa_acao
    @property
    def total_curtidas(self): return self.__total_curtidas
    @property
    def total_comentarios(self): return self.__total_comentarios
    @property
    def total_compartilhamentos(self): return self.__total_compartilhamentos
    @property
    def criado_em(self): return self.__criado_em
    @property
    def tags(self): return self.__tags
    @property
    def curtidas(self): return self.__curtidas

    @id.setter
    def id(self, valor): self.__id = valor
    @status.setter
    def status(self, valor): self.__status = valor
    @total_curtidas.setter
    def total_curtidas(self, valor): self.__total_curtidas = valor
    @total_comentarios.setter
    def total_comentarios(self, valor): self.__total_comentarios = valor
    @total_compartilhamentos.setter
    def total_compartilhamentos(self, valor): self.__total_compartilhamentos = valor

    def adicionar_tag(self, tag):
        self.__tags.append(tag)

    def possui_tag(self, tag_id):
        return any(t.id == tag_id for t in self.__tags)

    def adicionar_curtida(self, email_usuario):
        self.__curtidas.append(email_usuario)

    def foi_curtido_por(self, email_usuario):
        return email_usuario in self.__curtidas

    def to_dict(self, email_usuario=None):
        return {
            "id": self.__id,
            "author": self.__autor.username,
            "handle": f"@{self.__autor.username}",
            "avatarUrl": self.__autor.url_foto,
            "time": self.__criado_em.isoformat() if self.__criado_em else None,
            "content": self.__conteudo,
            "image": self.__url_imagem,
            "tags": [f"#{t.nome}" for t in self.__tags],
            "likes": self.__total_curtidas,
            "comments": self.__total_comentarios,
            "shares": self.__total_compartilhamentos,
            "goodDeed": self.__boa_acao,
            "status": self.__status,
            "curtidoPorMim": self.foi_curtido_por(email_usuario) if email_usuario else False,
            'authorEmail': self.autor.email,
        }