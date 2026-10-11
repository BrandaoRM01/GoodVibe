import json
import re
import socket
import urllib.error
import urllib.request

from projeto.config import Config

GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent'
TIMEOUT_SEGUNDOS = 25

class GeminiError(Exception):
    def __init__(self, tipo, http_status=None, retry_after=None, detalhe=None):
        super().__init__(tipo)
        self.tipo = tipo
        self.http_status = http_status
        self.retry_after = retry_after
        self.detalhe = detalhe

def _segundos(valor):
    encontrado = re.match(r'^(\d+(?:\.\d+)?)s$', str(valor or '').strip())
    return float(encontrado.group(1)) if encontrado else None

def _classificar_http(status, corpo):
    try:
        erro = json.loads(corpo).get('error') or {}
    except (ValueError, AttributeError):
        erro = {}

    status_api = str(erro.get('status') or '')
    mensagem = str(erro.get('message') or '').lower()
    detalhes = [d for d in (erro.get('details') or []) if isinstance(d, dict)]
    motivos = [str(d.get('reason') or '') for d in detalhes]

    if status == 429:
        quota_ids = []
        retry_after = None
        for d in detalhes:
            tipo = str(d.get('@type') or '')
            if tipo.endswith('QuotaFailure'):
                for v in d.get('violations') or []:
                    quota_ids.append(str(v.get('quotaId') or ''))
            elif tipo.endswith('RetryInfo'):
                retry_after = _segundos(d.get('retryDelay'))

        diaria = any('perday' in q.lower().replace('_', '').replace('-', '') for q in quota_ids) \
            or 'per day' in mensagem
        return GeminiError(
            'cota_diaria' if diaria else 'limite_temporario',
            http_status=429,
            retry_after=retry_after,
            detalhe=','.join(quota_ids) or status_api or None,
        )

    if status == 400:
        if 'API_KEY_INVALID' in motivos or 'api key' in mensagem or status_api == 'FAILED_PRECONDITION':
            return GeminiError('configuracao', http_status=400, detalhe=status_api or 'chave/regiao invalida')
        return GeminiError('requisicao_invalida', http_status=400, detalhe=status_api or None)

    if status in (401, 403, 404):
        return GeminiError('configuracao', http_status=status, detalhe=status_api or None)

    if status == 408:
        return GeminiError('timeout', http_status=status)

    if status >= 500:
        return GeminiError('indisponivel', http_status=status, detalhe=status_api or None)

    return GeminiError('requisicao_invalida', http_status=status, detalhe=status_api or None)

def gerar_conteudo(instrucao_sistema, contents, schema=None, max_tokens=700, temperatura=0.7):
    chave = Config.GEMINI_API_KEY
    if not chave:
        raise GeminiError('configuracao', detalhe='GEMINI_API_KEY ausente')

    geracao = {'temperature': temperatura, 'maxOutputTokens': max_tokens}
    if schema:
        geracao['responseMimeType'] = 'application/json'
        geracao['responseSchema'] = schema

    payload = {
        'systemInstruction': {'parts': [{'text': instrucao_sistema}]},
        'contents': contents,
        'generationConfig': geracao,
    }

    requisicao = urllib.request.Request(
        GEMINI_URL.format(modelo=Config.GEMINI_MODEL),
        data=json.dumps(payload).encode('utf-8'),
        method='POST',
        headers={'Content-Type': 'application/json', 'x-goog-api-key': chave},
    )

    try:
        with urllib.request.urlopen(requisicao, timeout=TIMEOUT_SEGUNDOS) as resposta:
            corpo = resposta.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        try:
            corpo_erro = e.read().decode('utf-8', errors='replace')
        except Exception:
            corpo_erro = ''
        raise _classificar_http(e.code, corpo_erro) from None
    except (socket.timeout, TimeoutError):
        raise GeminiError('timeout') from None
    except urllib.error.URLError as e:
        if isinstance(e.reason, (socket.timeout, TimeoutError)):
            raise GeminiError('timeout') from None
        raise GeminiError('indisponivel', detalhe='falha de conexao') from None
    except OSError:
        raise GeminiError('indisponivel', detalhe='falha de conexao') from None

    try:
        dados = json.loads(corpo)
    except ValueError:
        raise GeminiError('resposta_invalida', detalhe='corpo nao e JSON') from None

    candidatos = dados.get('candidates') or []
    if not candidatos:
        bloqueio = (dados.get('promptFeedback') or {}).get('blockReason')
        raise GeminiError('resposta_invalida', detalhe=f'sem candidatos {bloqueio or ""}'.strip())

    candidato = candidatos[0]
    partes = (candidato.get('content') or {}).get('parts') or []
    texto = ''.join(p.get('text', '') for p in partes if not p.get('thought')).strip()
    if not texto:
        raise GeminiError('resposta_invalida', detalhe=f"vazia {candidato.get('finishReason') or ''}".strip())

    return texto

def extrair_json(texto):
    limpo = texto.strip()
    limpo = re.sub(r'^```(?:json)?\s*|\s*```$', '', limpo)
    try:
        dados = json.loads(limpo)
    except ValueError:
        return None
    return dados if isinstance(dados, dict) else None