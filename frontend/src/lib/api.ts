export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const TOKEN_KEY = "goodvibe_token";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
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
};

export async function apiLogin(email: string, senha: string): Promise<Usuario> {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("senha", senha);

    const data = await request("/api/usuarios/login", { method: "POST", body: formData });
    setToken(data.token);
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