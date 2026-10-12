from flask import jsonify, request
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from email_validator import validate_email, EmailNotValidError
import hashlib
import secrets
import threading

from projeto.dao import UserDAO, HistoricoSenhaDAO
from projeto.models import HistoricoSenha
from projeto.factorys import UsuarioFactory
from projeto.config import Config
from projeto.utils import enviar_email_recuperacao_senha

MINUTOS_VALIDADE = 30
SEGUNDOS_ENTRE_ENVIOS = 60

MENSAGEM_ENVIO = (
    'Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha. '
    'Confira também a caixa de spam.'
)

def _agora_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def _hash_token(token):
    # No banco fica só o hash: quem enxergar a tabela não consegue usar o link
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

class RecuperacaoSenhaController:
    def __init__(self):
        self.__dao_usuario = UserDAO()
        self.__dao_historico_senha = HistoricoSenhaDAO()

    def __pode_enviar_novo_link(self, usuario):
        if not usuario.token_recuperacao or not usuario.token_expiracao:
            return True

        gerado_em = usuario.token_expiracao - timedelta(minutes=MINUTOS_VALIDADE)
        return (_agora_utc() - gerado_em).total_seconds() >= SEGUNDOS_ENTRE_ENVIOS

    def solicitar(self):
        email = (request.form.get('email') or '').strip()

        if not email:
            return jsonify({'erro': 'Informe o e-mail.'}), 400

        try:
            validate_email(email, check_deliverability=False)
        except EmailNotValidError:
            return jsonify({'erro': 'Informe um tipo de email válido!'}), 400

        usuario = self.__dao_usuario.buscar_usuario_por_email(email)

        # A resposta é sempre a mesma, exista a conta ou não, para não revelar quem está cadastrado
        if usuario and self.__pode_enviar_novo_link(usuario):
            token = secrets.token_urlsafe(32)
            expiracao = _agora_utc() + timedelta(minutes=MINUTOS_VALIDADE)
            self.__dao_usuario.salvar_token_recuperacao(usuario.email, _hash_token(token), expiracao)

            link = f"{Config.FRONTEND_URL}/redefinir-senha?token={token}"

            # Em segundo plano, para a resposta não demorar mais quando o e-mail existe
            threading.Thread(
                target=enviar_email_recuperacao_senha,
                args=(usuario.email, usuario.username, link, MINUTOS_VALIDADE),
                daemon=True,
            ).start()

        return jsonify({'mensagem': MENSAGEM_ENVIO}), 200

    def redefinir(self):
        token = (request.form.get('token') or '').strip()
        senha_nova = request.form.get('senha_nova')
        confirmar_senha_nova = request.form.get('confirmar_senha_nova')

        if not token or not senha_nova or not confirmar_senha_nova:
            return jsonify({'erro': 'Informe todos os campos obrigatórios.'}), 400

        usuario = self.__dao_usuario.buscar_por_token(_hash_token(token))

        if not usuario or not usuario.token_expiracao:
            return jsonify({'erro': 'Link inválido ou expirado. Solicite uma nova recuperação de senha.'}), 400

        if usuario.token_expiracao < _agora_utc():
            self.__dao_usuario.limpar_token(usuario.email)
            return jsonify({'erro': 'Link inválido ou expirado. Solicite uma nova recuperação de senha.'}), 400

        # Mesmas regras da tela de alterar senha
        if senha_nova != confirmar_senha_nova:
            return jsonify({'erro': 'As senhas não coincidem.'}), 400

        if len(senha_nova) < 8:
            return jsonify({'erro': 'A senha deve ter pelo menos 8 caracteres.'}), 400

        if check_password_hash(usuario.senha_hash, senha_nova):
            return jsonify({'erro': 'A nova senha não pode ser igual à senha atual.'}), 400

        senhas_antigas = self.__dao_historico_senha.listar_senhas_usuario(usuario.email)

        for hash_antigo in senhas_antigas:
            if check_password_hash(hash_antigo, senha_nova):
                return jsonify({'erro': 'Você não pode reutilizar uma das suas últimas cinco senhas.'}), 400

        if len(senhas_antigas) >= 5:
            self.__dao_historico_senha.remover_senha_antiga(usuario.email)

        senha_hash_nova = generate_password_hash(senha_nova)

        usuario_atualizado = UsuarioFactory.criar_usuario(
            email=usuario.email,
            senha_hash=senha_hash_nova,
            url_foto=usuario.url_foto,
            username=usuario.username,
            tipo_usuario=usuario.tipo_usuario(),
            qtd_seguidores=usuario.qtd_seguidores,
            qtd_seguindo=usuario.qtd_seguindo,
            descricao_perfil=usuario.descricao_perfil,
            data_entrada=usuario.data_entrada,
            url_capa=usuario.url_capa,
            localizacao=usuario.localizacao
        )

        self.__dao_usuario.editar_usuario(usuario_atualizado)

        historico = HistoricoSenha(usuario_atualizado, senha_hash_nova)
        self.__dao_historico_senha.inserir_nova_senha(historico)

        # O link só funciona uma vez
        self.__dao_usuario.limpar_token(usuario.email)

        return jsonify({'mensagem': 'Senha redefinida com sucesso! Faça login com a nova senha.'}), 200