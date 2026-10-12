from flask import jsonify, request, current_app
from projeto.dao import SeguidorDAO, UserDAO, NotificacaoDAO
from projeto.realtime import emitir_para_usuario

class SeguidorController:
    def __init__(self):
        self.__dao_seguidor = SeguidorDAO()
        self.__dao_usuario = UserDAO()
        self.__dao_notificacao = NotificacaoDAO()

    def __resposta(self, email_alvo, seguindo, mensagem):
        contagens = self.__dao_seguidor.buscar_contagens(email_alvo)
        return jsonify({
            'mensagem': mensagem,
            'seguindo': seguindo,
            'qtdSeguidores': contagens['qtd_seguidores'],
            'qtdSeguindo': contagens['qtd_seguindo'],
        }), 200

    def __validar_alvo(self, email):
        eu = request.usuario_atual.get('email')
        if email == eu:
            return jsonify({'erro': 'Você não pode seguir a si mesmo.'}), 400
        if not self.__dao_usuario.buscar_usuario_por_email(email):
            return jsonify({'erro': 'Usuário não encontrado.'}), 404
        return None

    def __avisar_relacao_alterada(self, a, b):
        try:
            emitir_para_usuario(a, 'conversas:atualizar', {})
            emitir_para_usuario(b, 'conversas:atualizar', {})
        except Exception:
            current_app.logger.exception('Falha ao emitir atualização de conversas')

    def __notificar_novo_seguidor(self, seguidor_email, seguido_email):
        try:
            notificacao = self.__dao_notificacao.registrar_seguidor(seguidor_email, seguido_email)
            emitir_para_usuario(seguido_email, 'notificacao:nova', {'notificacao': notificacao})
        except Exception:
            current_app.logger.exception('Falha ao notificar novo seguidor')

    def seguir(self, email):
        erro = self.__validar_alvo(email)
        if erro:
            return erro

        eu = request.usuario_atual.get('email')
        novo = self.__dao_seguidor.seguir(eu, email)

        if novo:
            self.__notificar_novo_seguidor(eu, email)
            self.__avisar_relacao_alterada(eu, email)

        return self.__resposta(email, True, 'Agora você está seguindo este usuário.')

    def deixar_de_seguir(self, email):
        erro = self.__validar_alvo(email)
        if erro:
            return erro

        eu = request.usuario_atual.get('email')
        if self.__dao_seguidor.deixar_de_seguir(eu, email):
            self.__avisar_relacao_alterada(eu, email)

        return self.__resposta(email, False, 'Você deixou de seguir este usuário.')

    def ids_seguindo(self):
        emails = self.__dao_seguidor.emails_seguindo(request.usuario_atual.get('email'))
        return jsonify({'emails': emails}), 200

    def listar(self, email, tipo):
        if tipo not in ('seguidores', 'seguindo'):
            return jsonify({'erro': 'Tipo de lista inválido.'}), 404

        if not self.__dao_usuario.buscar_usuario_por_email(email):
            return jsonify({'erro': 'Usuário não encontrado.'}), 404

        busca = (request.args.get('busca') or '').strip()[:50]
        ordem = request.args.get('ordem', 'recentes')
        if ordem not in ('recentes', 'antigos'):
            ordem = 'recentes'
        limite = min(max(request.args.get('limite', default=20, type=int), 1), 50)
        offset = max(request.args.get('offset', default=0, type=int), 0)

        usuarios, total = self.__dao_seguidor.listar_rede(
            email, tipo, request.usuario_atual.get('email'), busca, ordem, limite, offset
        )
        proximo_offset = offset + limite if offset + limite < total else None

        return jsonify({
            'usuarios': usuarios,
            'total': total,
            'proximoOffset': proximo_offset
        }), 200

    def remover_seguidor(self, email):
        eu = request.usuario_atual.get('email')
        if email == eu:
            return jsonify({'erro': 'Operação inválida.'}), 400
        if not self.__dao_usuario.buscar_usuario_por_email(email):
            return jsonify({'erro': 'Usuário não encontrado.'}), 404

        if self.__dao_seguidor.deixar_de_seguir(email, eu):
            self.__avisar_relacao_alterada(eu, email)

        return self.__resposta(eu, False, 'Seguidor removido com sucesso.')