export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const TOKEN_KEY = "goodvibe_token";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, lembrar?: boolean) {
    const manter = lembrar ?? localStorage.getItem(TOKEN_KEY) !== null;
    const destino = manter ? localStorage : sessionStorage;
    const outro = manter ? sessionStorage : localStorage;

    destino.setItem(TOKEN_KEY, token);
    outro.removeItem(TOKEN_KEY);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function request(path: string, options: RequestInit = {}) {
    const token = getToken();

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(data.erro ?? "Erro inesperado na requisição.", response.status);
    }

    return data;
}

export type Usuario = {
    email: string;
    username: string;
    url_foto: string;
    tipo_usuario: string;
    pode_moderar: boolean;
    pode_gerenciar_usuarios: boolean;
    qtd_seguidores: number;
    qtd_seguindo: number;
    qtd_postagens: number;
    descricao_perfil: string | null;
    data_entrada: string | null;
    url_capa: string | null;
    localizacao: string | null;
};

export async function apiLogin(email: string, senha: string, lembrar = false): Promise<Usuario> {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("senha", senha);
    formData.append("lembrar", lembrar ? "true" : "false");

    const data = await request("/api/usuarios/login", { method: "POST", body: formData });
    setToken(data.token, lembrar);
    return data.usuario;
}

export async function apiCadastrar(params: {
    email: string;
    senha: string;
    confirmarSenha: string;
    username: string;
    foto?: File | null;
}): Promise<{ mensagem: string }> {
    const formData = new FormData();
    formData.append("email", params.email);
    formData.append("senha", params.senha);
    formData.append("confirmar_senha", params.confirmarSenha);
    formData.append("username", params.username);
    if (params.foto) formData.append("foto", params.foto);

    return request("/api/usuarios/cadastro", { method: "POST", body: formData });
}

export async function apiEditarPerfil(params: {
    username: string;
    foto?: File | null;
    descricaoPerfil?: string;
    localizacao?: string;
    capa?: File | null;
}): Promise<Usuario> {
    const formData = new FormData();
    formData.append("username", params.username);
    if (params.foto) formData.append("foto", params.foto);
    if (params.descricaoPerfil !== undefined) formData.append("descricao_perfil", params.descricaoPerfil);
    if (params.localizacao !== undefined) formData.append("localizacao", params.localizacao);
    if (params.capa) formData.append("capa", params.capa);

    const data = await request("/api/usuarios/editar-perfil", { method: "POST", body: formData });
    setToken(data.token);
    return data.usuario;
}

export async function apiMe(): Promise<Usuario> {
    const data = await request("/api/usuarios/me");
    return data.usuario;
}

export async function apiLogout(): Promise<void> {
    try {
        await request("/api/usuarios/logout", { method: "POST" });
    } finally {
        clearToken();
    }
}

export async function apiApagarPerfil(email: string): Promise<void> {
    try {
        await request(`/api/usuarios/apagar-perfil/${encodeURIComponent(email)}`, { method: "DELETE" });
    } finally {
        clearToken();
    }
}

export async function apiAlterarSenha(params: {
    senhaAtual: string;
    senhaNova: string;
    confirmarSenhaNova: string;
}): Promise<void> {
    const formData = new FormData();
    formData.append("senha_atual", params.senhaAtual);
    formData.append("senha_nova", params.senhaNova);
    formData.append("confirmar_senha_nova", params.confirmarSenhaNova);

    const data = await request("/api/usuarios/alterar-senha", { method: "POST", body: formData });
    setToken(data.token);
}

export async function apiBuscarUsuarioPorEmail(email: string): Promise<Usuario> {
    const data = await request(`/api/usuarios/perfil/${encodeURIComponent(email)}`);
    return data.usuario;
}