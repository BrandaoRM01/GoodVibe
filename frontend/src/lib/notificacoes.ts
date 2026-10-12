import { request } from "./api";
import type { UsuarioResumoAPI } from "./mensagens";

export interface NotificacaoAPI {
    id: number;
    tipo: "seguidor" | "mensagem" | "denuncia";
    lida: boolean;
    qtd: number;
    criadoEm: string;
    conversaId: number | null;
    denunciaId: number | null;
    autor: UsuarioResumoAPI | null;
}

export interface PaginaNotificacoes {
    notificacoes: NotificacaoAPI[];
    naoLidas: number;
    proximoOffset: number | null;
}

export const LIMITE_NOTIFICACOES = 20;

export async function apiListarNotificacoes(offset: number): Promise<PaginaNotificacoes> {
    return request(`/api/notificacoes?limite=${LIMITE_NOTIFICACOES}&offset=${offset}`);
}

export async function apiTotalNaoLidasNotificacoes(): Promise<number> {
    const data: { total: number } = await request("/api/notificacoes/nao-lidas");
    return data.total;
}

export async function apiMarcarNotificacaoLida(id: number): Promise<void> {
    await request(`/api/notificacoes/${id}/lida`, { method: "POST" });
}

export async function apiMarcarTodasNotificacoesLidas(): Promise<void> {
    await request("/api/notificacoes/lidas", { method: "POST" });
}

export async function apiExcluirNotificacao(id: number): Promise<void> {
    await request(`/api/notificacoes/${id}`, { method: "DELETE" });
}

export async function apiExcluirTodasNotificacoes(): Promise<void> {
    await request("/api/notificacoes", { method: "DELETE" });
}