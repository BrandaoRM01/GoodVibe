import { request } from "./api";

export type TipoRede = "seguidores" | "seguindo";
export type OrdemRede = "recentes" | "antigos";

export const LIMITE_REDE = 20;

export interface UsuarioRedeAPI {
    email: string;
    username: string;
    url_foto: string | null;
    seguidoEm: string | null;
    euSigo: boolean;
}

export interface PaginaRede {
    usuarios: UsuarioRedeAPI[];
    total: number;
    proximoOffset: number | null;
}

export async function apiListarRede(
    email: string,
    tipo: TipoRede,
    params: { busca: string; ordem: OrdemRede; offset: number }
): Promise<PaginaRede> {
    const qs = new URLSearchParams({
        ordem: params.ordem,
        limite: String(LIMITE_REDE),
        offset: String(params.offset),
    });
    if (params.busca) qs.set("busca", params.busca);

    return request(`/api/seguidores/${encodeURIComponent(email)}/${tipo}?${qs.toString()}`);
}

export async function apiIdsSeguindo(): Promise<string[]> {
    const data: { emails: string[] } = await request("/api/seguidores/ids-seguindo");
    return data.emails;
}

export async function apiSeguir(email: string): Promise<{ mensagem: string }> {
    return request(`/api/seguidores/${encodeURIComponent(email)}`, { method: "POST" });
}

export async function apiDeixarDeSeguir(email: string): Promise<{ mensagem: string }> {
    return request(`/api/seguidores/${encodeURIComponent(email)}`, { method: "DELETE" });
}

export async function apiRemoverSeguidor(email: string): Promise<{ mensagem: string }> {
    return request(`/api/seguidores/remover-seguidor/${encodeURIComponent(email)}`, { method: "DELETE" });
}