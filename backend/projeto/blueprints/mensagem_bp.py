from flask import Blueprint
from projeto.controllers import MensagemController
from projeto.utils import token_required

mensagem_bp = Blueprint('mensagem', __name__, url_prefix='/api/mensagens')

controller = MensagemController()

@mensagem_bp.route('/conversas', methods=['GET'])
@token_required
def listar_conversas():
    return controller.listar_conversas()

@mensagem_bp.route('/nao-lidas', methods=['GET'])
@token_required
def nao_lidas():
    return controller.nao_lidas()

@mensagem_bp.route('/com/<email>', methods=['GET'])
@token_required
def abrir_conversa(email):
    return controller.abrir_conversa(email)

@mensagem_bp.route('/com/<email>', methods=['POST'])
@token_required
def enviar(email):
    return controller.enviar(email)

@mensagem_bp.route('/com/<email>/lida', methods=['POST'])
@token_required
def marcar_lida(email):
    return controller.marcar_lida(email)

@mensagem_bp.route('/postagem/<int:id_postagem>', methods=['GET'])
@token_required
def buscar_postagem_compartilhada(id_postagem):
    return controller.buscar_postagem_compartilhada(id_postagem)