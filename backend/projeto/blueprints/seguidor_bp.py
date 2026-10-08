from flask import Blueprint
from projeto.controllers import SeguidorController
from projeto.utils import token_required

seguidor_bp = Blueprint('seguidor', __name__, url_prefix='/api/seguidores')

controller = SeguidorController()

@seguidor_bp.route('/ids-seguindo', methods=['GET'])
@token_required
def ids_seguindo():
    return controller.ids_seguindo()

@seguidor_bp.route('/<email>', methods=['POST'])
@token_required
def seguir(email):
    return controller.seguir(email)

@seguidor_bp.route('/<email>', methods=['DELETE'])
@token_required
def deixar_de_seguir(email):
    return controller.deixar_de_seguir(email)

@seguidor_bp.route('/<email>/<tipo>', methods=['GET'])
@token_required
def listar(email, tipo):
    return controller.listar(email, tipo)

@seguidor_bp.route('/remover-seguidor/<email>', methods=['DELETE'])
@token_required
def remover_seguidor(email):
    return controller.remover_seguidor(email)