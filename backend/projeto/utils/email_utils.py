import logging
from html import escape

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

from projeto.config import Config

__all__ = ['enviar_email_recuperacao_senha']

logger = logging.getLogger(__name__)

_TEMPLATE_RECUPERACAO = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Recuperação de senha — GoodVib&amp;</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; background-color: #e4dbe0; }
  @media only screen and (max-width: 560px) {
    .container { width: 100% !important; }
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .titulo { font-size: 26px !important; }
    .botao a { display: block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#e4dbe0;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#e4dbe0;font-size:1px;line-height:1px;">
  Crie uma nova senha para a sua conta. O link vale por __MINUTOS__ minutos.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e4dbe0;">
  <tr>
    <td align="center" style="padding:36px 12px 28px 12px;">

      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">

        <!-- Cabeçalho com a identidade do GoodVib& -->
        <tr>
          <td align="center" class="px" bgcolor="#de297b"
              style="background-color:#de297b;background-image:linear-gradient(135deg,#de297b 0%,#f94b77 100%);border-radius:32px 32px 0 0;padding:40px 32px 44px 32px;">

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td width="46" height="46" align="center" valign="middle" bgcolor="#fefafd"
                    style="width:46px;height:46px;background-color:#fefafd;border-radius:16px;font-family:Arial,sans-serif;font-size:24px;line-height:46px;color:#de297b;">&#10022;</td>
                <td style="padding-left:12px;font-family:'Fredoka','Quicksand','Segoe UI',Arial,sans-serif;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#fefafd;">
                  Good<span style="color:#fcc5de;">Vib</span>&amp;
                </td>
              </tr>
            </table>

            <p style="margin:10px 0 0 0;font-family:'Fredoka','Quicksand','Segoe UI',Arial,sans-serif;font-size:13px;letter-spacing:0.4px;color:#fcc5de;">
              a rede social das boas ações
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:30px;">
              <tr>
                <td width="84" height="84" align="center" valign="middle" bgcolor="#fefafd"
                    style="width:84px;height:84px;background-color:#fefafd;border-radius:42px;border:6px solid #fcc5de;font-size:38px;line-height:84px;">&#128273;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Conteúdo -->
        <tr>
          <td class="px" bgcolor="#fefafd"
              style="background-color:#fefafd;border-radius:0 0 32px 32px;padding:38px 44px 42px 44px;font-family:'Fredoka','Quicksand','Segoe UI',Arial,sans-serif;color:#0f060c;">

            <h1 class="titulo" style="margin:0 0 6px 0;text-align:center;font-family:'Fredoka','Quicksand','Segoe UI',Arial,sans-serif;font-size:30px;line-height:1.2;font-weight:700;letter-spacing:-0.5px;color:#0f060c;">
              Esqueceu a senha?
            </h1>
            <p style="margin:0 0 22px 0;text-align:center;font-size:18px;font-weight:500;color:#de297b;">
              Olá, __NOME__! &#128075;
            </p>

            <p style="margin:0 0 30px 0;text-align:center;font-size:16px;line-height:1.65;color:#53424d;">
              Sem problema, acontece com todo mundo. Recebemos um pedido para redefinir a senha da sua conta.
              É só tocar no botão abaixo para escolher uma nova.
            </p>

            <!-- Botão -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="botao" style="margin:0 auto 30px auto;">
              <tr>
                <td align="center" bgcolor="#de297b"
                    style="border-radius:18px;background-color:#de297b;background-image:linear-gradient(135deg,#de297b 0%,#f94b77 100%);box-shadow:0 12px 30px -10px rgba(222,41,123,0.6);">
                  <a href="__LINK__" target="_blank"
                     style="display:inline-block;padding:17px 40px;font-family:'Fredoka','Quicksand','Segoe UI',Arial,sans-serif;font-size:17px;font-weight:600;color:#fefafd;text-decoration:none;border-radius:18px;">
                    Redefinir minha senha &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Validade -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px 0;">
              <tr>
                <td bgcolor="#ede5ea" style="background-color:#ede5ea;border:1px solid #d4c6cf;border-radius:18px;padding:15px 18px;font-size:14px;line-height:1.5;color:#53424d;">
                  &#9203;&nbsp; Este link vale por <strong style="color:#0f060c;">__MINUTOS__ minutos</strong> e só pode ser usado <strong style="color:#0f060c;">uma vez</strong>.
                </td>
              </tr>
            </table>

            <!-- Não foi você -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0;">
              <tr>
                <td bgcolor="#fde2ee" style="background-color:#fde2ee;border-radius:18px;padding:15px 18px;font-size:14px;line-height:1.5;color:#53424d;">
                  &#128737;&#65039;&nbsp; <strong style="color:#0f060c;">Não foi você?</strong> Pode ignorar este e-mail com tranquilidade: sua senha continua a mesma.
                </td>
              </tr>
            </table>

            <!-- Link alternativo -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:1px solid #d4c6cf;padding-top:22px;font-size:13px;line-height:1.6;color:#53424d;">
                  Se o botão não funcionar, copie e cole este endereço no navegador:
                  <br>
                  <a href="__LINK__" target="_blank" style="color:#de297b;word-break:break-all;text-decoration:none;font-weight:500;">__LINK__</a>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

      <!-- Rodapé -->
      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">
        <tr>
          <td align="center" class="px" style="padding:26px 24px 0 24px;font-family:'Fredoka','Quicksand','Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.6;color:#53424d;">
            <strong style="color:#de297b;">Good</strong><strong style="color:#0f060c;">Vib</strong><strong style="color:#de297b;">&amp;</strong>
            &#8226; espalhando boas vibrações &#128150;
            <br>
            <span style="font-size:12px;color:#53424d;">
              Você recebeu este e-mail porque alguém pediu a recuperação de senha para este endereço.
            </span>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>
"""

def enviar_email_recuperacao_senha(destinatario_email, destinatario_nome, link, minutos_validade):
    """Envia o e-mail de recuperação de senha pela API da Brevo. Retorna True se foi enviado."""
    if not Config.BREVO_API_KEY or not Config.BREVO_SENDER_EMAIL:
        logger.error('BREVO_API_KEY ou BREVO_SENDER_EMAIL não configurados; e-mail não enviado.')
        return False

    html = (
        _TEMPLATE_RECUPERACAO
        .replace('__NOME__', escape(destinatario_nome or ''))
        .replace('__LINK__', escape(link, quote=True))
        .replace('__MINUTOS__', str(minutos_validade))
    )

    texto = (
        f"Olá, {destinatario_nome}!\n\n"
        "Recebemos um pedido para redefinir a senha da sua conta no GoodVib&.\n"
        f"Acesse o link abaixo para escolher uma nova senha (vale por {minutos_validade} minutos e só pode ser usado uma vez):\n\n"
        f"{link}\n\n"
        "Se você não pediu essa alteração, ignore este e-mail: sua senha continua a mesma."
    )

    api = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(Config.BREVO_CONFIG))
    mensagem = sib_api_v3_sdk.SendSmtpEmail(
        sender={'name': Config.BREVO_SENDER_NAME, 'email': Config.BREVO_SENDER_EMAIL},
        to=[{'email': destinatario_email, 'name': destinatario_nome}],
        subject='Recuperação de senha — GoodVib&',
        html_content=html,
        text_content=texto,
    )

    try:
        api.send_transac_email(mensagem)
        return True
    except ApiException:
        logger.exception('A Brevo recusou o envio do e-mail de recuperação de senha')
    except Exception:
        logger.exception('Falha ao enviar o e-mail de recuperação de senha')
    return False