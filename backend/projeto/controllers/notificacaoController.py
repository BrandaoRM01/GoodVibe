from flask import jsonify, request
from projeto.dao import NotificacaoDAO

LIMITE_PADRAO = 20
LIMITE_MAXIMO = 50

class NotificacaoController:
    def __init__(self):
        self.__dao_notificacao = NotificacaoDAO()

    def __incluir_denuncias(self):
        return bool(request.usuario_atual.get('pode_moderar'))

    def listar(self):
        eu = request.usuario_atual.get('email')
        limite = request.args.get('limite', default=LIMITE_PADRAO, type=int)
        limite = max(1, min(limite, LIMITE_MAXIMO))
        offset = max(0, request.args.get('offset', default=0, type=int))
        incluir = self.__incluir_denuncias()

        itens = self.__dao_notificacao.listar(eu, incluir, limite + 1, offset)
        tem_mais = len(itens) > limite

        return jsonify({
            'notificacoes': itens[:limite],
            'naoLidas': self.__dao_notificacao.contar_nao_lidas(eu, incluir),
            'proximoOffset': offset + limite if tem_mais else None,
        }), 200

    def nao_lidas(self):
        total = self.__dao_notificacao.contar_nao_lidas(
            request.usuario_atual.get('email'), self.__incluir_denuncias()
        )
        return jsonify({'total': total}), 200

    def marcar_lida(self, id_notificacao):
        if not self.__dao_notificacao.marcar_lida(id_notificacao, request.usuario_atual.get('email')):
            return jsonify({'erro': 'Notificação não encontrada.'}), 404
        return jsonify({'mensagem': 'Notificação marcada como lida.'}), 200

    def marcar_todas_lidas(self):
        self.__dao_notificacao.marcar_todas_lidas(
            request.usuario_atual.get('email'), self.__incluir_denuncias()
        )
        return jsonify({'mensagem': 'Notificações marcadas como lidas.'}), 200

    def excluir(self, id_notificacao):
        if not self.__dao_notificacao.excluir(id_notificacao, request.usuario_atual.get('email')):
            return jsonify({'erro': 'Notificação não encontrada.'}), 404
        return jsonify({'mensagem': 'Notificação excluída.'}), 200

    def excluir_todas(self):
        self.__dao_notificacao.excluir_todas(
            request.usuario_atual.get('email'), self.__incluir_denuncias()
        )
        return jsonify({'mensagem': 'Notificações excluídas.'}), 200