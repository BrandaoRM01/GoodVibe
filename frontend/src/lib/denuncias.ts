import { request } from "./api";

export type TipoDenuncia = "postagem" | "comentario";

export const MOTIVOS_DENUNCIA = [
    { valor: "spam", rotulo: "Spam ou conteúdo repetitivo" },
    { valor: "ofensivo", rotulo: "Linguagem ofensiva ou desrespeitosa" },
    { valor: "assedio", rotulo: "Assédio ou bullying" },
    { valor: "desinformacao", rotulo: "Desinformação" },
    { valor: "improprio", rotulo: "Conteúdo impróprio" },
    { valor: "violencia", rotulo: "Violência ou ameaças" },
    { valor: "outro", rotulo: "Outro motivo" },
] as const;

export const MAX_CARACTERES_DENUNCIA = 300;
export const LIMITE_DENUNCIAS_PAINEL = 3;
export const LIMITE_DENUNCIAS_MODAL = 10;

export interface DenunciaAPI {
    id: number;
    tipo: TipoDenuncia;
    motivo: string;
    motivoRotulo: string;
    descricao: string | null;
    time: string | null;
    denunciante: { email: string; username: string; urlFoto: string | null };
    alvo: {
        id: number;
        postagemId: number | null;
        conteudo: string | null;
        imagem: string | null;
        autorEmail: string | null;
        autorUsername: string | null;
    };
}

export interface PaginaDenuncias {
    denuncias: DenunciaAPI[];
    total: number;
    proximoOffset: number | null;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function apiCriarDenuncia(payload: {
    tipo: TipoDenuncia;
    id: number;
    motivo: string;
    descricao?: string;
}): Promise<{ mensagem: string }> {
    return request("/api/denuncias", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
    });
}

export async function apiListarDenuncias(offset = 0, limite = LIMITE_DENUNCIAS_MODAL): Promise<PaginaDenuncias> {
    return request(`/api/denuncias/admin?limite=${limite}&offset=${offset}`);
}

export async function apiAprovarDenuncia(id: number): Promise<{ mensagem: string }> {
    return request(`/api/denuncias/admin/${id}/aprovar`, { method: "POST" });
}

export async function apiRejeitarDenuncia(id: number): Promise<{ mensagem: string }> {
    return request(`/api/denuncias/admin/${id}`, { method: "DELETE" });
}