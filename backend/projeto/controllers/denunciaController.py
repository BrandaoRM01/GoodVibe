from flask import jsonify, request
from mysql.connector.errors import IntegrityError
from projeto.dao import DenunciaDAO, PostagemDAO, ComentarioDAO

MOTIVOS = {
    'spam': 'Spam ou conteúdo repetitivo',
    'ofensivo': 'Linguagem ofensiva ou desrespeitosa',
    'assedio': 'Assédio ou bullying',
    'desinformacao': 'Desinformação',
    'improprio': 'Conteúdo impróprio',
    'violencia': 'Violência ou ameaças',
    'outro': 'Outro motivo',
}
MAX_DESCRICAO = 300
LIMITE_PADRAO = 10
LIMITE_MAXIMO = 50

class DenunciaController:
    def __init__(self):
        self.__dao_denuncia = DenunciaDAO()
        self.__dao_postagem = PostagemDAO()
        self.__dao_comentario = ComentarioDAO()

    def criar_denuncia(self):
        usuario = request.usuario_atual

        # admins têm a ação de excluir direto, então não denunciam
        if usuario.get('pode_moderar') or usuario.get('pode_gerenciar_usuarios'):
            return jsonify({'erro': 'Administradores não podem fazer denúncias.'}), 403

        dados = request.get_json(silent=True) or {}
        tipo = dados.get('tipo')
        motivo = dados.get('motivo')
        descricao = (dados.get('descricao') or '').strip()

        if tipo not in ('postagem', 'comentario'):
            return jsonify({'erro': 'Tipo de denúncia inválido.'}), 400
        try:
            alvo_id = int(dados.get('id'))
        except (TypeError, ValueError):
            return jsonify({'erro': 'Conteúdo denunciado inválido.'}), 400
        if motivo not in MOTIVOS:
            return jsonify({'erro': 'Selecione um motivo válido.'}), 400

        if motivo == 'outro':
            if not descricao:
                return jsonify({'erro': 'Descreva o motivo da denúncia.'}), 400
            if len(descricao) > MAX_DESCRICAO:
                return jsonify({'erro': f'A descrição pode ter no máximo {MAX_DESCRICAO} caracteres.'}), 400
        else:
            descricao = None

        autor_alvo = self.__dao_denuncia.buscar_autor_alvo(tipo, alvo_id)
        if not autor_alvo:
            return jsonify({'erro': 'Conteúdo não encontrado.'}), 404
        if autor_alvo == usuario.get('email'):
            return jsonify({'erro': 'Você não pode denunciar o seu próprio conteúdo.'}), 400

        try:
            self.__dao_denuncia.cadastrar(tipo, alvo_id, usuario.get('email'), motivo, descricao)
        except IntegrityError:
            return jsonify({'erro': 'Você já denunciou este conteúdo.'}), 409

        return jsonify({'mensagem': 'Denúncia enviada. Obrigado por ajudar a manter a comunidade segura!'}), 201

    def listar_denuncias(self):
        limite = request.args.get('limite', default=LIMITE_PADRAO, type=int)
        offset = request.args.get('offset', default=0, type=int)
        limite = max(1, min(limite, LIMITE_MAXIMO))
        offset = max(0, offset)

        # busca 1 a mais só para saber se existe próxima página
        itens = self.__dao_denuncia.listar(limite + 1, offset)
        tem_mais = len(itens) > limite
        itens = itens[:limite]

        return jsonify({
            'denuncias': [d.to_dict(MOTIVOS.get(d._Denuncia__motivo)) for d in itens],
            'total': self.__dao_denuncia.contar_abertas(),
            'proximoOffset': offset + limite if tem_mais else None
        }), 200

    def aprovar_denuncia(self, id_denuncia):
        denuncia = self.__dao_denuncia.buscar_por_id(id_denuncia)
        if not denuncia:
            return jsonify({'erro': 'Denúncia não encontrada.'}), 404

        # as denúncias do alvo são removidas em cascata pelo banco
        if denuncia.tipo == 'postagem':
            self.__dao_postagem.excluir_postagem(denuncia.alvo_id)
            mensagem = 'Denúncia aprovada. A postagem foi excluída.'
        else:
            comentario = self.__dao_comentario.buscar_por_id(denuncia.alvo_id)
            if comentario:
                self.__dao_comentario.excluir_comentario(comentario)
            mensagem = 'Denúncia aprovada. O comentário foi excluído.'

        return jsonify({'mensagem': mensagem}), 200

    def rejeitar_denuncia(self, id_denuncia):
        if not self.__dao_denuncia.buscar_por_id(id_denuncia):
            return jsonify({'erro': 'Denúncia não encontrada.'}), 404

        self.__dao_denuncia.excluir(id_denuncia)
        return jsonify({'mensagem': 'Denúncia rejeitada.'}), 200