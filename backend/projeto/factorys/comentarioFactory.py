from projeto.models import Comentario

class ComentarioFactory:
    @staticmethod
    def criar_comentario(postagem_id, autor, conteudo, id=None, comentario_pai_id=None, profundidade=0,
                         total_curtidas=0, total_respostas=0, criado_em=None, editado_em=None,
                         curtido_por_mim=False):
        return Comentario(
            postagem_id=postagem_id, autor=autor, conteudo=conteudo, id=id,
            comentario_pai_id=comentario_pai_id, profundidade=profundidade,
            total_curtidas=total_curtidas, total_respostas=total_respostas,
            criado_em=criado_em, editado_em=editado_em, curtido_por_mim=curtido_por_mim
        )
