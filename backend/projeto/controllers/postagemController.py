from flask import jsonify, request
from projeto.dao import PostagemDAO
from projeto.factorys import PostagemFactory, UsuarioFactory
from projeto.config import Config
from werkzeug.utils import secure_filename
import os

class PostagemController:
    def __init__(self):
        self.__dao_postagem = PostagemDAO()

    def __extrair_tags(self):
        tags = request.form.getlist('tags')
        if len(tags) == 1 and ',' in tags[0]:
            tags = tags[0].split(',')

        vistos = set()
        tags_limpas = []
        for t in tags:
            nome = t.strip()
            if not nome:
                continue
            chave = nome.lower()
            if chave in vistos:
                continue
            vistos.add(chave)
            tags_limpas.append(nome)
        return tags_limpas

    def listar_feed(self):
        email_usuario = request.usuario_atual.get('email')
        tag_nome = request.args.get('tag', '').strip() or None
        autor_username = request.args.get('autor', '').strip() or None
        postagens = self.__dao_postagem.listar_feed(tag_nome, autor_username)
        return jsonify({'postagens': [p.to_dict(email_usuario) for p in postagens]}), 200

    def tags_tendencias(self):
        limite = request.args.get('limite', default=4, type=int)
        tendencias = self.__dao_postagem.buscar_tags_tendencias(limite)
        return jsonify({'tendencias': tendencias}), 200

    def buscar(self):
        termo = request.args.get('termo', '').strip().lstrip('@#').strip()[:50]
        if not termo:
            return jsonify({'usuarios': [], 'tags': []}), 200

        resultado = self.__dao_postagem.buscar_usuarios_e_tags(termo)
        return jsonify(resultado), 200

    def listar_todas(self):
        postagens = self.__dao_postagem.listar_todas()
        return jsonify({'postagens': [p.to_dict() for p in postagens]}), 200

    def buscar_postagem(self, id_postagem):
        postagem = self.__dao_postagem.buscar_por_id(id_postagem)

        if not postagem:
            return jsonify({'erro': 'Postagem não encontrada.'}), 404

        return jsonify({'postagem': postagem.to_dict()}), 200

    def cadastrar_postagem(self):
        conteudo = request.form.get('conteudo')
        boa_acao = request.form.get('boa_acao')
        imagem = request.files.get('imagem')
        tags_nomes = self.__extrair_tags()

        autor_email = request.usuario_atual.get('email')

        if not conteudo or not conteudo.strip():
            return jsonify({'erro': 'Informe o conteúdo da postagem.'}), 400

        url_imagem = None
        if imagem and imagem.filename != "":
            extensao = os.path.splitext(imagem.filename)[1]
            nome_arquivo = secure_filename(f"post_{autor_email}_{os.urandom(4).hex()}{extensao}")

            url_imagem = f"uploads/postagem/{nome_arquivo}"
            caminho = os.path.join(Config.UPLOAD_POSTAGEM, nome_arquivo)

            imagem.save(caminho)

        autor = UsuarioFactory.criar_usuario(
            email=autor_email,
            username=request.usuario_atual.get('username'),
            url_foto=request.usuario_atual.get('url_foto'),
            tipo_usuario=request.usuario_atual.get('tipo_usuario'),
        )

        nova_postagem = PostagemFactory.criar_postagem(
            conteudo=conteudo.strip(),
            autor=autor,
            status='aprovado',
            url_imagem=url_imagem,
            boa_acao=boa_acao,
        )

        self.__dao_postagem.cadastrar_postagem(nova_postagem, tags_nomes)

        return jsonify({'mensagem': 'Postagem publicada com sucesso!'}), 201

    def editar_postagem(self, id_postagem):
        usuario_logado = request.usuario_atual
        postagem_existente = self.__dao_postagem.buscar_por_id(id_postagem)

        if not postagem_existente:
            return jsonify({'erro': 'Postagem não encontrada.'}), 404

        eh_autor = postagem_existente.autor.email == usuario_logado.get('email')
        if not eh_autor:
            return jsonify({'erro': 'Você não tem permissão para esta ação.'}), 403

        conteudo = request.form.get('conteudo')
        if not conteudo or not conteudo.strip():
            return jsonify({'erro': 'Informe o conteúdo da postagem.'}), 400

        imagem = request.files.get('imagem')
        remover_imagem = request.form.get('remover_imagem') == 'true'
        tags_nomes = self.__extrair_tags()
        autor_email = usuario_logado.get('email')

        url_imagem_antiga = postagem_existente.url_imagem

        if imagem and imagem.filename != "":
            if url_imagem_antiga:
                nome_antigo = os.path.basename(url_imagem_antiga)
                caminho_antigo = os.path.join(Config.UPLOAD_POSTAGEM, nome_antigo)
                if os.path.exists(caminho_antigo):
                    os.remove(caminho_antigo)

            extensao = os.path.splitext(imagem.filename)[1]
            nome_arquivo = secure_filename(f"post_{autor_email}_{os.urandom(4).hex()}{extensao}")
            caminho = os.path.join(Config.UPLOAD_POSTAGEM, nome_arquivo)
            imagem.save(caminho)

            url_imagem = f"uploads/postagem/{nome_arquivo}"

        elif remover_imagem:
            if url_imagem_antiga:
                nome_antigo = os.path.basename(url_imagem_antiga)
                caminho_antigo = os.path.join(Config.UPLOAD_POSTAGEM, nome_antigo)
                if os.path.exists(caminho_antigo):
                    os.remove(caminho_antigo)
            url_imagem = None

        else:
            url_imagem = url_imagem_antiga

        self.__dao_postagem.atualizar_postagem(
            id_postagem, conteudo.strip(), url_imagem, postagem_existente.boa_acao, tags_nomes
        )

        return jsonify({'mensagem': 'Postagem atualizada com sucesso!'}), 200

    def curtir_postagem(self, id_postagem):
        email_usuario = request.usuario_atual.get('email')

        postagem = self.__dao_postagem.buscar_por_id(id_postagem)
        if not postagem:
            return jsonify({'erro': 'Postagem não encontrada.'}), 404

        if postagem.status != 'aprovado':
            return jsonify({'erro': 'Não é possível curtir uma postagem que ainda não foi aprovada.'}), 400

        self.__dao_postagem.curtir_postagem(id_postagem, email_usuario)

        return jsonify({'mensagem': 'Postagem curtida com sucesso!'}), 200

    def descurtir_postagem(self, id_postagem):
        email_usuario = request.usuario_atual.get('email')

        postagem = self.__dao_postagem.buscar_por_id(id_postagem)
        if not postagem:
            return jsonify({'erro': 'Postagem não encontrada.'}), 404

        self.__dao_postagem.descurtir_postagem(id_postagem, email_usuario)

        return jsonify({'mensagem': 'Curtida removida com sucesso!'}), 200

    def moderar_postagem(self, id_postagem):
        novo_status = request.json.get('status') if request.is_json else request.form.get('status')

        if novo_status not in ('aprovado', 'reprovado', 'pendente'):
            return jsonify({'erro': 'Status inválido. Use aprovado, reprovado ou pendente.'}), 400

        postagem = self.__dao_postagem.buscar_por_id(id_postagem)
        if not postagem:
            return jsonify({'erro': 'Postagem não encontrada.'}), 404

        self.__dao_postagem.alterar_status(id_postagem, novo_status)

        return jsonify({'mensagem': f'Postagem marcada como {novo_status}.'}), 200

    def excluir_postagem(self, id_postagem):
        usuario_logado = request.usuario_atual
        postagem = self.__dao_postagem.buscar_por_id(id_postagem)

        if not postagem:
            return jsonify({'erro': 'Postagem não encontrada.'}), 404

        eh_autor = postagem.autor.email == usuario_logado.get('email')
        pode_moderar = usuario_logado.get('pode_gerenciar_usuarios') or usuario_logado.get('tipo_usuario') == 'admin'

        if not eh_autor and not pode_moderar:
            return jsonify({'erro': 'Você não tem permissão para esta ação.'}), 403

        self.__dao_postagem.excluir_postagem(id_postagem)

        return jsonify({'mensagem': 'Postagem excluída com sucesso.'}), 200

    def sugestoes_tags(self):
        termo = request.args.get('termo', '').strip()
        if not termo:
            return jsonify({'sugestoes': []}), 200

        sugestoes = self.__dao_postagem.buscar_sugestoes_tags(termo)
        return jsonify({'sugestoes': sugestoes}), 200