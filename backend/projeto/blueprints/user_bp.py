from flask import Blueprint, request
from projeto.controllers import UserController
from projeto.utils import token_required, moderador_required, gerenciador_required

user_bp = Blueprint('user', __name__, url_prefix='/api/usuarios')

controller = UserController()

@user_bp.route('/login', methods=['POST'])
def login():
    return controller.autenticar_usuario()

@user_bp.route('/cadastro', methods=['POST'])
def cadastro():
    return controller.cadastrar_usuario()

@user_bp.route('/logout', methods=['POST'])
def logout():
    return controller.logout_usuario()

@user_bp.route('/me', methods=['GET'])
@token_required
def me():
    return controller.me()

@user_bp.route('/editar-perfil', methods=['POST'])
@token_required
def editar_perfil():
    return controller.editar_perfil()

@user_bp.route('/apagar-perfil/<email>', methods=['DELETE'])
@token_required
def apagar_perfil(email):
    return controller.apagar_perfil(email)

@user_bp.route('/perfil/<email>', methods=['GET'])
@token_required
def buscar_perfil_publico(email):
    return controller.buscar_perfil_publico(email)

@user_bp.route('/admin/usuarios', methods=['GET'])
@token_required
@gerenciador_required
def gerenciar_usuarios():
    return controller.listar_usuarios()

@user_bp.route('/admin/usuarios/<email>', methods=['DELETE'])
@token_required
@gerenciador_required
def excluir_usuario(email):
    return controller.excluir_usuario(email)

@user_bp.route('/admin/usuarios/<email>/permissao', methods=['PATCH'])
@token_required
@gerenciador_required
def alterar_permissao(email):
    return controller.alterar_permissao(email)

@user_bp.route('/destaque', methods=['GET'])
@token_required
def usuarios_destaque():
    return controller.usuarios_destaque()

@user_bp.route('/alterar-senha', methods=['POST'])
@token_required
def alterar_senha():
    return controller.alterar_senha()