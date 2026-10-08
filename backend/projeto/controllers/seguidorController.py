from flask import jsonify, request
from projeto.dao import SeguidorDAO, UserDAO

class SeguidorController:
    def __init__(self):
        self.__dao_seguidor = SeguidorDAO()
        self.__dao_usuario = UserDAO()

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

    def seguir(self, email):
        erro = self.__validar_alvo(email)
        if erro:
            return erro
        self.__dao_seguidor.seguir(request.usuario_atual.get('email'), email)
        return self.__resposta(email, True, 'Agora você está seguindo este usuário.')

    def deixar_de_seguir(self, email):
        erro = self.__validar_alvo(email)
        if erro:
            return erro
        self.__dao_seguidor.deixar_de_seguir(request.usuario_atual.get('email'), email)
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

        self.__dao_seguidor.deixar_de_seguir(email, eu)
        return self.__resposta(eu, False, 'Seguidor removido com sucesso.')