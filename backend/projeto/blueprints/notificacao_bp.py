from flask import Blueprint
from projeto.controllers import NotificacaoController
from projeto.utils import token_required

notificacao_bp = Blueprint('notificacao', __name__, url_prefix='/api/notificacoes')

controller = NotificacaoController()

@notificacao_bp.route('', methods=['GET'])
@token_required
def listar():
    return controller.listar()

@notificacao_bp.route('', methods=['DELETE'])
@token_required
def excluir_todas():
    return controller.excluir_todas()

@notificacao_bp.route('/nao-lidas', methods=['GET'])
@token_required
def nao_lidas():
    return controller.nao_lidas()

@notificacao_bp.route('/lidas', methods=['POST'])
@token_required
def marcar_todas_lidas():
    return controller.marcar_todas_lidas()

@notificacao_bp.route('/<int:id_notificacao>/lida', methods=['POST'])
@token_required
def marcar_lida(id_notificacao):
    return controller.marcar_lida(id_notificacao)

@notificacao_bp.route('/<int:id_notificacao>', methods=['DELETE'])
@token_required
def excluir(id_notificacao):
    return controller.excluir(id_notificacao)