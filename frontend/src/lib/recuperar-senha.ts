import { request } from "./api";

export async function apiEsqueciSenha(email: string): Promise<string> {
    const formData = new FormData();
    formData.append("email", email);

    const data: { mensagem: string } = await request("/api/usuarios/esqueci-senha", {
        method: "POST",
        body: formData,
    });
    return data.mensagem;
}

export async function apiRedefinirSenha(params: {
    token: string;
    senhaNova: string;
    confirmarSenhaNova: string;
}): Promise<string> {
    const formData = new FormData();
    formData.append("token", params.token);
    formData.append("senha_nova", params.senhaNova);
    formData.append("confirmar_senha_nova", params.confirmarSenhaNova);

    const data: { mensagem: string } = await request("/api/usuarios/redefinir-senha", {
        method: "POST",
        body: formData,
    });
    return data.mensagem;
}