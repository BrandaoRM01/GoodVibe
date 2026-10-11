import type { PerfilRecomendadoAPI } from "@/lib/assistente";

export interface MensagemChat {
    id: number;
    papel: "usuario" | "assistente";
    texto: string;
    perfis?: PerfilRecomendadoAPI[];
    erro?: boolean;
    falhou?: boolean;
}

const CHAVE = "goodviba:assistente:conversa";
const MAX_SALVAS = 50;

function mensagemValida(m: any): m is MensagemChat {
    return (
        m &&
        typeof m === "object" &&
        typeof m.id === "number" &&
        (m.papel === "usuario" || m.papel === "assistente") &&
        typeof m.texto === "string"
    );
}

export function carregarConversa(): MensagemChat[] {
    if (typeof window === "undefined") return [];
    try {
        const bruto = window.sessionStorage.getItem(CHAVE);
        if (!bruto) return [];
        const dados = JSON.parse(bruto);
        return Array.isArray(dados) ? dados.filter(mensagemValida) : [];
    } catch {
        return [];
    }
}

export function salvarConversa(mensagens: MensagemChat[]): void {
    if (typeof window === "undefined") return;
    try {
        // Erros transitórios e mensagens não enviadas não precisam ser guardados
        const validas = mensagens.filter((m) => !m.erro && !m.falhou).slice(-MAX_SALVAS);
        if (validas.length === 0) {
            window.sessionStorage.removeItem(CHAVE);
            return;
        }
        window.sessionStorage.setItem(CHAVE, JSON.stringify(validas));
    } catch {
        /* armazenamento indisponível ou cheio: segue sem salvar */
    }
}

export function limparConversaAssistente(): void {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.removeItem(CHAVE);
    } catch {
        /* ignora */
    }
}