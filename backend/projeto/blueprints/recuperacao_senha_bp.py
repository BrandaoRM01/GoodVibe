from flask import Blueprint
from projeto.controllers import RecuperacaoSenhaController

recuperacao_senha_bp = Blueprint('recuperacao_senha', __name__, url_prefix='/api/usuarios')

controller = RecuperacaoSenhaController()

@recuperacao_senha_bp.route('/esqueci-senha', methods=['POST'])
def esqueci_senha():
    return controller.solicitar()

@recuperacao_senha_bp.route('/redefinir-senha', methods=['POST'])
def redefinir_senha():
    return controller.redefinir()