import { request } from "./api";

export interface UsuarioDestaqueAPI {
    email: string;
    username: string;
    url_foto: string | null;
    totalPostagens: number;
}

export async function apiUsuariosDestaque(limite = 3): Promise<UsuarioDestaqueAPI[]> {
    const data: { destaques: UsuarioDestaqueAPI[] } = await request(
        `/api/usuarios/destaque?limite=${limite}`
    );
    return data.destaques;
}