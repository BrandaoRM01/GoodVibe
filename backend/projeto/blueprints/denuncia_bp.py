from flask import Blueprint
from projeto.controllers import DenunciaController
from projeto.utils import token_required, moderador_required

denuncia_bp = Blueprint('denuncia', __name__, url_prefix='/api/denuncias')

controller = DenunciaController()

@denuncia_bp.route('', methods=['POST'])
@token_required
def criar_denuncia():
    return controller.criar_denuncia()

@denuncia_bp.route('/admin', methods=['GET'])
@token_required
@moderador_required
def listar_denuncias():
    return controller.listar_denuncias()

@denuncia_bp.route('/admin/<int:id_denuncia>/aprovar', methods=['POST'])
@token_required
@moderador_required
def aprovar_denuncia(id_denuncia):
    return controller.aprovar_denuncia(id_denuncia)

@denuncia_bp.route('/admin/<int:id_denuncia>', methods=['DELETE'])
@token_required
@moderador_required
def rejeitar_denuncia(id_denuncia):
    return controller.rejeitar_denuncia(id_denuncia)