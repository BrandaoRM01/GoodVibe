import re
from flask import jsonify, request, current_app
from projeto.dao import MensagemDAO, NotificacaoDAO, UserDAO, PostagemDAO
from projeto.realtime import emitir_para_usuario

LIMITE_PADRAO = 30
LIMITE_MAXIMO = 50
MAX_CONTEUDO = 2000
PADRAO_CLIENT_ID = re.compile(r'^[A-Za-z0-9_-]{8,40}$')

class MensagemController:
    def __init__(self):
        self.__dao_mensagem = MensagemDAO()
        self.__dao_notificacao = NotificacaoDAO()
        self.__dao_usuario = UserDAO()
        self.__dao_postagem = PostagemDAO()

    def __resumo(self, usuario):
        return {'email': usuario.email, 'username': usuario.username, 'url_foto': usuario.url_foto}

    def __validar_destino(self, email):
        eu = request.usuario_atual.get('email')
        if email.lower() == eu.lower():
            return None, (jsonify({'erro': 'Você não pode conversar consigo mesmo.'}), 400)

        destino = self.__dao_usuario.buscar_usuario_por_email(email)
        if not destino:
            return None, (jsonify({'erro': 'Usuário não encontrado.'}), 404)

        return destino, None

    def listar_conversas(self):
        conversas = self.__dao_mensagem.listar_conversas(request.usuario_atual.get('email'))
        return jsonify({'conversas': conversas}), 200

    def nao_lidas(self):
        total = self.__dao_mensagem.contar_nao_lidas(request.usuario_atual.get('email'))
        return jsonify({'total': total}), 200

    def abrir_conversa(self, email):
        destino, erro = self.__validar_destino(email)
        if erro:
            return erro

        eu = request.usuario_atual.get('email')
        limite = request.args.get('limite', default=LIMITE_PADRAO, type=int)
        limite = max(1, min(limite, LIMITE_MAXIMO))
        antes = request.args.get('antes', type=int)
        depois = request.args.get('depois', type=int)

        conversa_id = self.__dao_mensagem.buscar_id_conversa(eu, destino.email)

        mensagens, proximo_antes = [], None
        if conversa_id:
            mensagens, proximo_antes = self.__dao_mensagem.listar_mensagens(
                conversa_id, limite, antes, depois
            )

        return jsonify({
            'usuario': self.__resumo(destino),
            'conversaId': conversa_id,
            'mensagens': mensagens,
            'proximoAntes': proximo_antes,
        }), 200

    def enviar(self, email):
        destino, erro = self.__validar_destino(email)
        if erro:
            return erro

        eu = request.usuario_atual.get('email')
        dados = request.get_json(silent=True) or {}

        client_id = dados.get('clientId')
        if client_id is not None and (not isinstance(client_id, str) or not PADRAO_CLIENT_ID.match(client_id)):
            return jsonify({'erro': 'Identificador da mensagem inválido.'}), 400

        postagem_id = dados.get('postagemId')
        conteudo = None
        if postagem_id is not None:
            try:
                postagem_id = int(postagem_id)
            except (TypeError, ValueError):
                return jsonify({'erro': 'Publicação inválida.'}), 400
            tipo = 'postagem'
        else:
            tipo = 'texto'
            conteudo = dados.get('conteudo')
            if not isinstance(conteudo, str) or not conteudo.strip():
                return jsonify({'erro': 'Escreva uma mensagem antes de enviar.'}), 400
            conteudo = conteudo.strip()
            if len(conteudo) > MAX_CONTEUDO:
                return jsonify({'erro': f'A mensagem pode ter no máximo {MAX_CONTEUDO} caracteres.'}), 400

        # Regra central: só envia quem segue o destinatário (a recíproca não é exigida)
        if not self.__dao_mensagem.segue(eu, destino.email):
            return jsonify({'erro': f'Siga {destino.username} para enviar mensagens.'}), 403

        if tipo == 'postagem' and not self.__dao_mensagem.postagem_disponivel(postagem_id):
            return jsonify({'erro': 'Esta publicação não está mais disponível.'}), 404

        try:
            mensagem, criada = self.__dao_mensagem.enviar(
                eu, destino.email, tipo, conteudo, postagem_id, client_id
            )
        except Exception:
            current_app.logger.exception('Falha ao salvar mensagem')
            return jsonify({'erro': 'Não foi possível enviar a mensagem. Tente novamente.'}), 500

        if not criada:
            return jsonify({'mensagem': mensagem}), 200

        self.__propagar(eu, destino, mensagem)
        return jsonify({'mensagem': mensagem}), 201

    def __propagar(self, eu, destino, mensagem):
        try:
            emitir_para_usuario(destino.email, 'mensagem:nova', {'mensagem': mensagem, 'conversaCom': eu})
            emitir_para_usuario(eu, 'mensagem:nova', {'mensagem': mensagem, 'conversaCom': destino.email})
        except Exception:
            current_app.logger.exception('Falha ao emitir mensagem em tempo real')

        try:
            notificacao = self.__dao_notificacao.registrar_mensagem(
                destino.email, eu, mensagem['conversaId']
            )
            emitir_para_usuario(destino.email, 'notificacao:nova', {'notificacao': notificacao})
        except Exception:
            current_app.logger.exception('Falha ao registrar notificação de mensagem')

    def marcar_lida(self, email):
        destino, erro = self.__validar_destino(email)
        if erro:
            return erro

        eu = request.usuario_atual.get('email')
        conversa_id = self.__dao_mensagem.buscar_id_conversa(eu, destino.email)
        if not conversa_id:
            return jsonify({'lidas': 0}), 200

        lidas = self.__dao_mensagem.marcar_lidas(conversa_id, eu)

        try:
            emitir_para_usuario(destino.email, 'mensagens:lidas', {'leitor': eu})
            emitir_para_usuario(eu, 'mensagens:lidas', {'leitor': eu})
        except Exception:
            current_app.logger.exception('Falha ao emitir confirmação de leitura')

        return jsonify({'lidas': lidas}), 200

    def buscar_postagem_compartilhada(self, id_postagem):
        postagem = self.__dao_postagem.buscar_por_id(id_postagem)
        if not postagem or postagem.status != 'aprovado':
            return jsonify({'erro': 'Esta publicação não está mais disponível.'}), 404

        return jsonify({'postagem': postagem.to_dict(request.usuario_atual.get('email'))}), 200