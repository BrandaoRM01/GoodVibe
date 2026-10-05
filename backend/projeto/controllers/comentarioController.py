from flask import jsonify, request
from projeto.dao import ComentarioDAO
from projeto.factorys import ComentarioFactory, UsuarioFactory

MAX_CARACTERES = 500
MAX_PROFUNDIDADE = 4         
LIMITE_COMENTARIOS_PADRAO = 10
LIMITE_RESPOSTAS_PADRAO = 5
LIMITE_MAXIMO = 50

class ComentarioController:
    def __init__(self):
        self.__dao_comentario = ComentarioDAO()

    def __ler_dados(self):
        return request.get_json(silent=True) or request.form

    def __ler_conteudo(self):
        conteudo = (self.__ler_dados().get('conteudo') or '').strip()
        if not conteudo:
            return None, (jsonify({'erro': 'Escreva algo para comentar.'}), 400)
        if len(conteudo) > MAX_CARACTERES:
            return None, (jsonify({'erro': f'O comentário pode ter no máximo {MAX_CARACTERES} caracteres.'}), 400)
        return conteudo, None

    def __paginacao(self, limite_padrao):
        limite = request.args.get('limite', default=limite_padrao, type=int)
        offset = request.args.get('offset', default=0, type=int)
        return max(1, min(limite, LIMITE_MAXIMO)), max(0, offset)

    def __resposta_paginada(self, itens, limite, offset):
        tem_mais = len(itens) > limite
        itens = itens[:limite]
        return jsonify({
            'comentarios': [c.to_dict() for c in itens],
            'proximoOffset': offset + limite if tem_mais else None
        }), 200

    def listar_comentarios(self, id_postagem):
        email_usuario = request.usuario_atual.get('email')

        if not self.__dao_comentario.buscar_resumo_postagem(id_postagem):
            return jsonify({'erro': 'Postagem não encontrada.'}), 404

        limite, offset = self.__paginacao(LIMITE_COMENTARIOS_PADRAO)
        # busca 1 a mais só para saber se existe próxima página
        itens = self.__dao_comentario.listar_raiz(id_postagem, email_usuario, limite + 1, offset)
        return self.__resposta_paginada(itens, limite, offset)

    def listar_respostas(self, id_comentario):
        email_usuario = request.usuario_atual.get('email')

        if not self.__dao_comentario.buscar_por_id(id_comentario):
            return jsonify({'erro': 'Comentário não encontrado.'}), 404

        limite, offset = self.__paginacao(LIMITE_RESPOSTAS_PADRAO)
        itens = self.__dao_comentario.listar_respostas(id_comentario, email_usuario, limite + 1, offset)
        return self.__resposta_paginada(itens, limite, offset)

    def criar_comentario(self, id_postagem):
        usuario = request.usuario_atual
        email_usuario = usuario.get('email')

        conteudo, erro = self.__ler_conteudo()
        if erro:
            return erro

        postagem = self.__dao_comentario.buscar_resumo_postagem(id_postagem)
        if not postagem:
            return jsonify({'erro': 'Postagem não encontrada.'}), 404
        if postagem['status'] != 'aprovado':
            return jsonify({'erro': 'Não é possível comentar em uma postagem que ainda não foi aprovada.'}), 400

        comentario_pai_id = self.__ler_dados().get('comentario_pai_id')
        profundidade = 0

        if comentario_pai_id not in (None, ''):
            try:
                comentario_pai_id = int(comentario_pai_id)
            except (TypeError, ValueError):
                return jsonify({'erro': 'Comentário a ser respondido é inválido.'}), 400

            pai = self.__dao_comentario.buscar_por_id(comentario_pai_id)
            if not pai or pai.postagem_id != id_postagem:
                return jsonify({'erro': 'Comentário a ser respondido não foi encontrado.'}), 404

            profundidade = pai.profundidade + 1
            if profundidade > MAX_PROFUNDIDADE:
                return jsonify({'erro': 'Limite de respostas aninhadas atingido.'}), 400
        else:
            comentario_pai_id = None

        autor = UsuarioFactory.criar_usuario(
            email=email_usuario,
            username=usuario.get('username'),
            url_foto=usuario.get('url_foto'),
            tipo_usuario=usuario.get('tipo_usuario'),
        )
        novo_comentario = ComentarioFactory.criar_comentario(
            postagem_id=id_postagem,
            autor=autor,
            conteudo=conteudo,
            comentario_pai_id=comentario_pai_id,
            profundidade=profundidade,
        )
        self.__dao_comentario.cadastrar_comentario(novo_comentario)

        salvo = self.__dao_comentario.buscar_por_id(novo_comentario.id, email_usuario)
        return jsonify({
            'mensagem': 'Comentário publicado com sucesso!',
            'comentario': salvo.to_dict(),
            'totalComentarios': self.__dao_comentario.total_comentarios_postagem(id_postagem)
        }), 201

    def editar_comentario(self, id_comentario):
        email_usuario = request.usuario_atual.get('email')

        comentario = self.__dao_comentario.buscar_por_id(id_comentario)
        if not comentario:
            return jsonify({'erro': 'Comentário não encontrado.'}), 404

        if comentario.autor.email != email_usuario:
            return jsonify({'erro': 'Você não tem permissão para esta ação.'}), 403

        conteudo, erro = self.__ler_conteudo()
        if erro:
            return erro

        self.__dao_comentario.atualizar_comentario(id_comentario, conteudo)

        atualizado = self.__dao_comentario.buscar_por_id(id_comentario, email_usuario)
        return jsonify({'mensagem': 'Comentário atualizado com sucesso!', 'comentario': atualizado.to_dict()}), 200

    def excluir_comentario(self, id_comentario):
        usuario = request.usuario_atual
        email_usuario = usuario.get('email')

        comentario = self.__dao_comentario.buscar_por_id(id_comentario)
        if not comentario:
            return jsonify({'erro': 'Comentário não encontrado.'}), 404

        postagem = self.__dao_comentario.buscar_resumo_postagem(comentario.postagem_id)

        eh_autor = comentario.autor.email == email_usuario
        eh_dono_da_postagem = bool(postagem) and postagem['autor_email'] == email_usuario
        pode_moderar = usuario.get('pode_gerenciar_usuarios') or usuario.get('tipo_usuario') == 'admin'

        if not (eh_autor or eh_dono_da_postagem or pode_moderar):
            return jsonify({'erro': 'Você não tem permissão para esta ação.'}), 403

        self.__dao_comentario.excluir_comentario(comentario)

        return jsonify({
            'mensagem': 'Comentário excluído com sucesso.',
            'totalComentarios': self.__dao_comentario.total_comentarios_postagem(comentario.postagem_id)
        }), 200

    def curtir_comentario(self, id_comentario):
        email_usuario = request.usuario_atual.get('email')

        if not self.__dao_comentario.buscar_por_id(id_comentario):
            return jsonify({'erro': 'Comentário não encontrado.'}), 404

        self.__dao_comentario.curtir_comentario(id_comentario, email_usuario)

        atualizado = self.__dao_comentario.buscar_por_id(id_comentario, email_usuario)
        return jsonify({'mensagem': 'Comentário curtido com sucesso!', 'comentario': atualizado.to_dict()}), 200

    def descurtir_comentario(self, id_comentario):
        email_usuario = request.usuario_atual.get('email')

        if not self.__dao_comentario.buscar_por_id(id_comentario):
            return jsonify({'erro': 'Comentário não encontrado.'}), 404

        self.__dao_comentario.descurtir_comentario(id_comentario, email_usuario)

        atualizado = self.__dao_comentario.buscar_por_id(id_comentario, email_usuario)
        return jsonify({'mensagem': 'Curtida removida com sucesso!', 'comentario': atualizado.to_dict()}), 200
