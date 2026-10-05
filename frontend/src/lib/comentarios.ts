import { request } from "./api";

export const LIMITE_COMENTARIOS = 10;
export const LIMITE_RESPOSTAS = 5;
export const MAX_CARACTERES_COMENTARIO = 500;
export const MAX_PROFUNDIDADE_COMENTARIO = 4;

export interface ComentarioAPI {
    id: number;
    postagemId: number;
    parentId: number | null;
    author: string;
    handle: string;
    authorEmail: string;
    avatarUrl: string | null;
    time: string | null;
    content: string;
    likes: number;
    replies: number;
    depth: number;
    edited: boolean;
    curtidoPorMim: boolean;
}

export interface PaginaComentarios {
    comentarios: ComentarioAPI[];
    proximoOffset: number | null;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function apiListarComentarios(
    postagemId: number,
    offset = 0,
    limite = LIMITE_COMENTARIOS
): Promise<PaginaComentarios> {
    return request(`/api/postagens/${postagemId}/comentarios?limite=${limite}&offset=${offset}`);
}

export async function apiListarRespostas(
    comentarioId: number,
    offset = 0,
    limite = LIMITE_RESPOSTAS
): Promise<PaginaComentarios> {
    return request(`/api/comentarios/${comentarioId}/respostas?limite=${limite}&offset=${offset}`);
}

export interface CriarComentarioPayload {
    postagemId: number;
    conteudo: string;
    comentarioPaiId?: number | null;
}

export async function apiCriarComentario(
    payload: CriarComentarioPayload
): Promise<{ mensagem: string; comentario: ComentarioAPI; totalComentarios: number }> {
    return request(`/api/postagens/${payload.postagemId}/comentarios`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
            conteudo: payload.conteudo,
            comentario_pai_id: payload.comentarioPaiId ?? null,
        }),
    });
}

export async function apiEditarComentario(
    id: number,
    conteudo: string
): Promise<{ mensagem: string; comentario: ComentarioAPI }> {
    return request(`/api/comentarios/${id}`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ conteudo }),
    });
}

export async function apiExcluirComentario(
    id: number
): Promise<{ mensagem: string; totalComentarios: number }> {
    return request(`/api/comentarios/${id}`, { method: "DELETE" });
}

export async function apiCurtirComentario(id: number): Promise<{ mensagem: string; comentario: ComentarioAPI }> {
    return request(`/api/comentarios/${id}/curtir`, { method: "POST" });
}

export async function apiDescurtirComentario(id: number): Promise<{ mensagem: string; comentario: ComentarioAPI }> {
    return request(`/api/comentarios/${id}/curtir`, { method: "DELETE" });
}

export function formatarTempoComentario(dataStr: string | null): string {
    if (!dataStr) return "";

    const normalizado = dataStr.includes("T") ? dataStr : dataStr.replace(" ", "T");
    const data = new Date(normalizado);
    if (isNaN(data.getTime())) return dataStr;

    const diffMin = Math.floor((Date.now() - data.getTime()) / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;
    if (diffDias < 30) return `${Math.floor(diffDias / 7)}sem`;

    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
