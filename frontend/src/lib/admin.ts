import { request } from "./api";

export type TipoUsuario = "user" | "admin" | "superadmin";
export type FiltroTipoUsuario = TipoUsuario | "todos";

export const ROTULO_TIPO_USUARIO: Record<TipoUsuario, string> = {
    user: "User",
    admin: "Admin",
    superadmin: "Superadmin",
};

export const LIMITE_USUARIOS_ADMIN = 20;

export interface UsuarioRankingAPI {
    email: string;
    username: string;
    url_foto: string | null;
    tipo_usuario: TipoUsuario;
    totalPostagens: number;
}

export interface ResumoAdminAPI {
    totalUsuarios: number;
    denunciasAbertas: number;
    kpis: {
        usuariosAtivos: { valor: number; variacao: number | null };
        boasAcoesHoje: { valor: number; variacao: number | null };
        engajamento: { valor: number };
    };
    crescimento: { name: string; users: number; posts: number }[];
    boasAcoesSemana: { day: string; deeds: number }[];
    destaques: UsuarioRankingAPI[];
}

export interface PaginaUsuariosRanking {
    usuarios: UsuarioRankingAPI[];
    total: number;
    proximoOffset: number | null;
}

export async function apiResumoAdmin(): Promise<ResumoAdminAPI> {
    return request("/api/usuarios/admin/resumo");
}

export async function apiListarUsuariosAdmin(params: {
    busca: string;
    tipo: FiltroTipoUsuario;
    offset?: number;
    limite?: number;
}): Promise<PaginaUsuariosRanking> {
    const { busca, tipo, offset = 0, limite = LIMITE_USUARIOS_ADMIN } = params;

    const query = new URLSearchParams({ limite: String(limite), offset: String(offset) });
    if (busca.trim()) query.set("busca", busca.trim());
    if (tipo !== "todos") query.set("tipo", tipo);

    return request(`/api/usuarios/admin/ranking?${query.toString()}`);
}

export async function apiAlterarPermissao(email: string): Promise<{ mensagem: string }> {
    return request(`/api/usuarios/admin/usuarios/${encodeURIComponent(email)}/permissao`, {
        method: "PATCH",
    });
}

export async function apiExcluirUsuario(email: string): Promise<{ mensagem: string }> {
    return request(`/api/usuarios/admin/usuarios/${encodeURIComponent(email)}`, {
        method: "DELETE",
    });
}