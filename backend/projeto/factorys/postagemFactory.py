from projeto.models import Postagem, Tag

class PostagemFactory:
    @staticmethod
    def criar_postagem(conteudo, autor, status='aprovado', id=None, url_imagem=None, boa_acao=None,
                        total_curtidas=0, total_comentarios=0, total_compartilhamentos=0,
                        criado_em=None, tags=None, curtidas=None):
        return Postagem(
            conteudo=conteudo, autor=autor, status=status, id=id, url_imagem=url_imagem,
            boa_acao=boa_acao, total_curtidas=total_curtidas, total_comentarios=total_comentarios,
            total_compartilhamentos=total_compartilhamentos, criado_em=criado_em,
            tags=tags, curtidas=curtidas
        )