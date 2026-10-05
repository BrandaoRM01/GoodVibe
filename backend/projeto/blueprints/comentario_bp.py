from flask import Blueprint
from projeto.controllers import ComentarioController
from projeto.utils import token_required

comentario_bp = Blueprint('comentario', __name__, url_prefix='/api')

controller = ComentarioController()

@comentario_bp.route('/postagens/<int:id_postagem>/comentarios', methods=['GET'])
@token_required
def listar_comentarios(id_postagem):
    return controller.listar_comentarios(id_postagem)

@comentario_bp.route('/postagens/<int:id_postagem>/comentarios', methods=['POST'])
@token_required
def criar_comentario(id_postagem):
    return controller.criar_comentario(id_postagem)

@comentario_bp.route('/comentarios/<int:id_comentario>/respostas', methods=['GET'])
@token_required
def listar_respostas(id_comentario):
    return controller.listar_respostas(id_comentario)

@comentario_bp.route('/comentarios/<int:id_comentario>', methods=['PUT'])
@token_required
def editar_comentario(id_comentario):
    return controller.editar_comentario(id_comentario)

@comentario_bp.route('/comentarios/<int:id_comentario>', methods=['DELETE'])
@token_required
def excluir_comentario(id_comentario):
    return controller.excluir_comentario(id_comentario)

@comentario_bp.route('/comentarios/<int:id_comentario>/curtir', methods=['POST'])
@token_required
def curtir_comentario(id_comentario):
    return controller.curtir_comentario(id_comentario)

@comentario_bp.route('/comentarios/<int:id_comentario>/curtir', methods=['DELETE'])
@token_required
def descurtir_comentario(id_comentario):
    return controller.descurtir_comentario(id_comentario)
