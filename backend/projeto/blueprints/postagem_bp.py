from flask import Blueprint
from projeto.controllers import PostagemController
from projeto.utils import token_required, moderador_required, gerenciador_required

postagem_bp = Blueprint('postagem', __name__, url_prefix='/api/postagens')

controller = PostagemController()

@postagem_bp.route('/feed', methods=['GET'])
@token_required
def feed():
    return controller.listar_feed()

@postagem_bp.route('/tags/tendencias', methods=['GET'])
@token_required
def tags_tendencias():
    return controller.tags_tendencias()

@postagem_bp.route('/<int:id_postagem>', methods=['GET'])
def buscar_postagem(id_postagem):
    return controller.buscar_postagem(id_postagem)

@postagem_bp.route('', methods=['POST'])
@token_required
def cadastrar_postagem():
    return controller.cadastrar_postagem()

@postagem_bp.route('/<int:id_postagem>', methods=['PUT'])
@token_required
def editar_postagem(id_postagem):
    return controller.editar_postagem(id_postagem)

@postagem_bp.route('/<int:id_postagem>/curtir', methods=['POST'])
@token_required
def curtir_postagem(id_postagem):
    return controller.curtir_postagem(id_postagem)

@postagem_bp.route('/<int:id_postagem>/curtir', methods=['DELETE'])
@token_required
def descurtir_postagem(id_postagem):
    return controller.descurtir_postagem(id_postagem)

@postagem_bp.route('/<int:id_postagem>', methods=['DELETE'])
@token_required
def excluir_postagem(id_postagem):
    return controller.excluir_postagem(id_postagem)

@postagem_bp.route('/admin/postagens', methods=['GET'])
@token_required
@moderador_required
def listar_todas():
    return controller.listar_todas()

@postagem_bp.route('/admin/postagens/<int:id_postagem>/status', methods=['PATCH'])
@token_required
@moderador_required
def moderar_postagem(id_postagem):
    return controller.moderar_postagem(id_postagem)

@postagem_bp.route('/tags/sugestoes', methods=['GET'])
@token_required
def sugestoes_tags():
    return controller.sugestoes_tags()