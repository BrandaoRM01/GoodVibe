import { request } from "./api";

export const MAX_MENSAGEM = 1000;
export const MAX_HISTORICO = 10;
export const TIMEOUT_ASSISTENTE_MS = 70_000;

export interface MensagemHistorico {
    papel: "usuario" | "assistente";
    texto: string;
}

export interface PerfilRecomendadoAPI {
    email: string;
    username: string;
    url_foto: string | null;
    tags: string[];
    trecho: string | null;
}

export interface RespostaAssistenteAPI {
    mensagem: { papel: "assistente"; texto: string };
    perfis: PerfilRecomendadoAPI[];
}

export async function apiEnviarMensagemAssistente(
    mensagem: string,
    historico: MensagemHistorico[]
): Promise<RespostaAssistenteAPI> {
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), TIMEOUT_ASSISTENTE_MS);

    try {
        return await request("/api/assistente/mensagem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem, historico }),
            signal: controlador.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}