from flask import Blueprint
from projeto.controllers import AssistenteController
from projeto.utils import token_required

assistente_bp = Blueprint('assistente', __name__, url_prefix='/api/assistente')

controller = AssistenteController()

@assistente_bp.route('/mensagem', methods=['POST'])
@token_required
def enviar_mensagem():
    return controller.enviar_mensagem()