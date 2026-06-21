from flask import jsonify, request
from projeto.dao import UserDAO
from projeto.factorys import UsuarioFactory
from projeto.config import Config
from projeto.utils import gerar_token
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from email_validator import validate_email, EmailNotValidError
import os

class UserController:
    def __init__(self):
        self.__dao_usuario = UserDAO()

    def __validar_email(self, email):
        try:
            validate_email(email)
            return True, None
        except EmailNotValidError as e:
            print(f'Email inválido: {str(e)}')
            return False, 'Informe um tipo de email válido!'

    def __verificar_senha(self, usuario_obj, senha, senha_hash):
        if not check_password_hash(senha_hash, senha):
            return False
        return True

    def me(self):
        return jsonify({'usuario': request.usuario_atual}), 200

    def listar_usuarios(self):
        usuarios = self.__dao_usuario.listar_usuarios()
        return jsonify({'usuarios': [u.to_dict() for u in usuarios]}), 200

    def cadastrar_usuario(self):
        email = request.form.get('email')
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')
        username = request.form.get('username')
        foto = request.files.get('foto')

        usuario = self.__dao_usuario.buscar_usuario_por_email(email)
        lista_usernames = self.__dao_usuario.pegar_usernames()

        if usuario:
            return jsonify({'erro': 'Email já cadastrado. Por favor, use outro email ou faça login.'}), 409

        if not email or not senha or not confirmar_senha or not username:
            return jsonify({'erro': 'Informe os campos que são obrigatórios.'}), 400

        email_valido, msg_email = self.__validar_email(email)
        if not email_valido:
            return jsonify({'erro': msg_email}), 400

        if username.capitalize().strip() in lista_usernames:
            return jsonify({'erro': 'Nome de usuário já cadastrado. Por favor, escolha outro nome.'}), 409

        if senha != confirmar_senha:
            return jsonify({'erro': 'As senhas não coincidem. Por favor, tente novamente.'}), 400

        usuario_senha = UsuarioFactory.criar_usuario(
            email=email,
            username=username.capitalize().strip()
        )

        senha_hash = generate_password_hash(senha)

        if not self.__verificar_senha(usuario_senha, senha, senha_hash):
            return jsonify({'erro': 'Não foi possível validar a senha informada.'}), 400

        if not foto or foto.filename == "":
            nome_arquivo = "img/default/user_foto.webp"
        else:
            extensao = os.path.splitext(foto.filename)[1]
            nome_ajustado = secure_filename(username.lower().replace(" ", "_"))

            nome_arquivo = f"uploads/user/{nome_ajustado}{extensao}"

            caminho = os.path.join(Config.UPLOAD_USER, f"{nome_ajustado}{extensao}")

            foto.save(caminho)

        novo_usuario = UsuarioFactory.criar_usuario(
            email=email,
            senha_hash=senha_hash,
            url_foto=nome_arquivo,
            username=username.capitalize().strip()
        )

        self.__dao_usuario.cadastrar_usuario(novo_usuario)

        return jsonify({'mensagem': 'Cadastro realizado com sucesso! Faça login para acessar sua conta.'}), 201

    def autenticar_usuario(self):
        email = request.form.get('email')
        senha = request.form.get('senha')

        if not email or not senha:
            return jsonify({'erro': 'Todos os campos são obrigatórios.'}), 400

        email_valido, msg_email = self.__validar_email(email)
        if not email_valido:
            return jsonify({'erro': msg_email}), 400

        usuario = self.__dao_usuario.buscar_usuario_por_email(email)

        if not usuario:
            return jsonify({'erro': 'Usuário não encontrado. Por favor, verifique o email e tente novamente.'}), 404

        if check_password_hash(usuario.senha_hash, senha):
            token = gerar_token(usuario.to_dict())
            return jsonify({
                'mensagem': f'Bem vindo, {usuario.username}!',
                'token': token,
                'usuario': usuario.to_dict()
            }), 200

        return jsonify({'erro': 'Usuário ou senha incorretos. Por favor, tente novamente.'}), 401

    def logout_usuario(self):
        return jsonify({'mensagem': 'Logout realizado com sucesso.'}), 200

    def excluir_usuario(self, email):
        self.__dao_usuario.excluir_usuario(email)
        return jsonify({'mensagem': 'Usuário excluído com sucesso.'}), 200

    def apagar_perfil(self, email):
        usuario_logado = request.usuario_atual
        if not usuario_logado.get('pode_gerenciar_usuarios') and usuario_logado.get('email') != email:
            return jsonify({'erro': 'Você não tem permissão para esta ação.'}), 403

        self.__dao_usuario.excluir_usuario(email)
        return jsonify({'mensagem': 'Perfil excluído com sucesso.'}), 200

    def alterar_permissao(self, usuario_email):
        usuario_logado = request.usuario_atual

        if usuario_email == usuario_logado.get('email'):
            return jsonify({'erro': 'Você não pode alterar sua própria permissão de usuário'}), 400

        usuario = self.__dao_usuario.buscar_usuario_por_email(usuario_email)

        if not usuario:
            return jsonify({'erro': 'Usuário não encontrado'}), 404

        if usuario.tipo_usuario() == 'admin':
            self.__dao_usuario.alterar_permissao_usuario(usuario, 'user')
        else:
            self.__dao_usuario.alterar_permissao_usuario(usuario, 'admin')

        return jsonify({'mensagem': 'Permissão alterada com sucesso'}), 200

    def editar_perfil(self):
        email = request.usuario_atual.get('email')
        username = request.form.get('username')
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')
        foto = request.files.get('foto')

        usuario = self.__dao_usuario.buscar_usuario_por_email(email)
        lista_usernames = self.__dao_usuario.pegar_usernames()

        if not username:
            return jsonify({'erro': 'Informe o campo obrigatório.'}), 400

        if not usuario:
            return jsonify({'erro': 'Usuário não encontrado no sistema.'}), 404

        username_ajustado = username.capitalize().strip()

        if username_ajustado in lista_usernames and username_ajustado != request.usuario_atual.get('username'):
            return jsonify({'erro': 'Username já está em uso por outro usuário. Tente outro nome.'}), 409

        senha_hash = usuario.senha_hash

        if senha and confirmar_senha:
            if senha != confirmar_senha:
                return jsonify({'erro': 'As senhas não coincidem.'}), 400

            senha_hash_nova = generate_password_hash(senha)

            if not self.__verificar_senha(usuario, senha, senha_hash_nova):
                return jsonify({'erro': 'Não foi possível validar a nova senha.'}), 400

            senha_hash = senha_hash_nova

        if senha and not confirmar_senha:
            return jsonify({'erro': 'Se você quer mudar sua senha, informe também a confirmação de senha.'}), 400

        username_antigo = usuario.username
        nome_antigo = os.path.basename(usuario.url_foto)

        if not foto or foto.filename == "":
            if username_antigo != username_ajustado:
                if "default" not in usuario.url_foto:
                    extensao = os.path.splitext(nome_antigo)[1]
                    nome_ajustado_file = secure_filename(username_ajustado.lower().replace(" ", "_"))

                    novo_nome = f"{nome_ajustado_file}{extensao}"

                    caminho_antigo = os.path.join(Config.UPLOAD_USER, nome_antigo)
                    caminho_novo = os.path.join(Config.UPLOAD_USER, novo_nome)

                    if os.path.exists(caminho_antigo):
                        if os.path.exists(caminho_novo):
                            os.remove(caminho_novo)
                        os.rename(caminho_antigo, caminho_novo)

                    nome_arquivo = f"uploads/user/{novo_nome}"
                else:
                    nome_arquivo = usuario.url_foto
            else:
                nome_arquivo = usuario.url_foto
        else:
            extensao = os.path.splitext(foto.filename)[1]
            nome_ajustado_file = secure_filename(username_ajustado.lower().replace(" ", "_"))

            novo_nome = f"{nome_ajustado_file}{extensao}"
            caminho = os.path.join(Config.UPLOAD_USER, novo_nome)

            if "default" not in usuario.url_foto:
                caminho_antigo = os.path.join(Config.UPLOAD_USER, nome_antigo)
                if os.path.exists(caminho_antigo):
                    os.remove(caminho_antigo)

            foto.stream.seek(0)
            foto.save(caminho)

            nome_arquivo = f"uploads/user/{novo_nome}"

        tipo_usuario = request.usuario_atual.get('tipo_usuario')

        usuario_atualizado = UsuarioFactory.criar_usuario(
            email=email,
            senha_hash=senha_hash,
            url_foto=nome_arquivo,
            username=username_ajustado,
            tipo_usuario=tipo_usuario
        )

        self.__dao_usuario.editar_usuario(usuario_atualizado)

        novo_token = gerar_token(usuario_atualizado.to_dict())

        return jsonify({
            'mensagem': 'Usuário atualizado com sucesso!',
            'token': novo_token,
            'usuario': usuario_atualizado.to_dict()
        }), 200