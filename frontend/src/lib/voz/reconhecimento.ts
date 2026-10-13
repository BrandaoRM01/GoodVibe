export type Destino = | "feed" | "mensagens" | "assistente" | "perfil" | "painel" | "home" | "login" | "cadastro" | "senha";
export type Comando = "ativar" | "desativar" | "parar" | "repetir" | "sim" | "nao" | `ir:${Destino}`;
export type ErroReconhecimento = "permissao" | "microfone" | "rede";
export type ModoReconhecimento = "comandos" | "resposta";

interface RecEvento {
    resultIndex: number;
    results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface RecLike {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onstart: (() => void) | null;
    onresult: ((e: RecEvento) => void) | null;
    onerror: ((e: { error: string }) => void) | null;
    onend: (() => void) | null;
    start(): void;
    abort(): void;
}
type RecCtor = new () => RecLike;

function ctor(): RecCtor | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const reconhecimentoSuportado = () => !!ctor();

function normalizar(texto: string) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const VERBO_IR = /\b(ir|va|vai|vamos|abrir|abra|abre|navegar|navegue|levar|leve|mostrar|mostre|fazer|faca|criar|crie|entrar|entre|acessar|acesse|cadastrar|recuperar|esqueci)\b/;

function destinoDe(s: string): Destino | null {
    if (/\bsenha\b/.test(s)) return "senha"; // "esqueci minha senha", "recuperar senha"
    if (/\b(cadastro|cadastrar|criar conta|crie conta|registrar|inscrever)\b/.test(s)) return "cadastro";
    if (/\b(mensagem|mensagens|conversa|conversas|chat)\b/.test(s)) return "mensagens";
    if (/\bassistente (de )?(ia|inteligencia artificial)\b|\bassistente ia\b|\bia\b/.test(s)) return "assistente";
    if (/\b(perfil)\b/.test(s)) return "perfil";
    if (/\b(painel|admin|administracao)\b/.test(s)) return "painel";
    if (/\b(login|entrar|acessar|acesse|entre)\b/.test(s)) return "login";
    if (/\b(pagina inicial|pagina principal|home|apresentacao|site)\b/.test(s)) return "home";
    if (/\b(inicio|feed|explorar)\b/.test(s)) return "feed";
    return null;
}

export function interpretar(texto: string): Comando | null {
    const s = normalizar(texto);
    const curto = s.split(" ").length === 1;

    if (VERBO_IR.test(s)) {
        const d = destinoDe(s);
        if (d) return `ir:${d}`;
    }
    if (/\bdesativ\w*/.test(s) && /\b(assistente|voz)\b/.test(s)) return "desativar"; // antes de "ativar"
    if (/\bativ\w*/.test(s) && /\bassistente\b/.test(s)) return "ativar";
    if (/\b(parar|pare|interromper)\b/.test(s) && (curto || /\b(leitura|ler)\b/.test(s))) return "parar";
    if (/\b(repetir|repita)\b/.test(s) && (curto || /\b(leitura|ler)\b/.test(s))) return "repetir";
    return null;
}

/** Resposta à pergunta inicial. Ambíguo (ex.: "sim ou não") retorna null. */
export function interpretarResposta(texto: string): "sim" | "nao" | null {
    const s = normalizar(texto);
    const nao = /\b(nao|depois|nunca|recuso|negativo)\b/.test(s);
    const sim = /\b(sim|quero|pode|claro|aceito|ativar|ativa|ok|positivo)\b/.test(s);
    if (nao && sim && /\bsim\b/.test(s)) return null;
    if (nao) return "nao";
    if (sim) return "sim";
    return null;
}

export interface Reconhecedor {
    iniciar(): void;
    parar(): void;
}

/** Só interpreta o que foi dito: a transcrição não é guardada nem enviada por este código. */
export function criarReconhecedor(cb: {
    modo?: ModoReconhecimento;
    aoComando: (c: Comando) => void;
    aoEstado: (e: "ouvindo") => void;
    aoErro: (e: ErroReconhecimento) => void;
}): Reconhecedor | null {
    const C = ctor();
    if (!C) return null;
    const r = new C();
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = false;

    let ativo = false;
    let religar: number | undefined;

    r.onstart = () => cb.aoEstado("ouvindo");
    r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (!res.isFinal) continue;
            const t = res[0]?.transcript ?? "";
            const c = cb.modo === "resposta" ? interpretarResposta(t) : interpretar(t);
            if (c) cb.aoComando(c);
        }
    };
    r.onerror = (e) => {
        const m: ErroReconhecimento | null =
            e.error === "not-allowed" || e.error === "service-not-allowed"
                ? "permissao"
                : e.error === "audio-capture"
                    ? "microfone"
                    : e.error === "network"
                        ? "rede"
                        : null; // no-speech/aborted: apenas reinicia
        if (m) {
            ativo = false;
            cb.aoErro(m);
        }
    };
    r.onend = () => {
        if (!ativo) return;
        religar = window.setTimeout(() => {
            if (!ativo) return;
            try {
                r.start();
            } catch {
                /* já iniciado */
            }
        }, 400);
    };

    return {
        iniciar() {
            ativo = true;
            try {
                r.start();
            } catch {
                /* já iniciado */
            }
        },
        parar() {
            ativo = false;
            window.clearTimeout(religar);
            r.onstart = r.onresult = r.onerror = r.onend = null;
            try {
                r.abort();
            } catch {
                /* ignorar */
            }
        },
    };
}