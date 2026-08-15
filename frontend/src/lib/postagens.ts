import { request } from "./api";

export interface PostagemAPI {
    id: number;
    author: string;
    handle: string;
    avatarUrl: string | null;
    time: string | null;
    content: string;
    image: string | null;
    tags: string[];
    likes: number;
    comments: number;
    shares: number;
    goodDeed: string | null;
    status: "pendente" | "aprovado" | "reprovado";
    curtidoPorMim: boolean;
}

interface FeedResponse {
    postagens: PostagemAPI[];
}

export async function apiListarFeed(tag?: string, autor?: string): Promise<PostagemAPI[]> {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (autor) params.set("autor", autor);
    const query = params.toString();

    const data: FeedResponse = await request(`/api/postagens/feed${query ? `?${query}` : ""}`);
    return data.postagens;
}

export async function apiBuscarPostagem(id: number): Promise<PostagemAPI> {
    const data: { postagem: PostagemAPI } = await request(`/api/postagens/${id}`);
    return data.postagem;
}

export interface CriarPostagemPayload {
    conteudo: string;
    imagem?: File;
    tags?: string[];
}

export async function apiCriarPostagem(payload: CriarPostagemPayload): Promise<{ mensagem: string }> {
    const formData = new FormData();
    formData.append("conteudo", payload.conteudo);
    if (payload.imagem) formData.append("imagem", payload.imagem);
    (payload.tags ?? []).forEach((nome) => formData.append("tags", nome));

    return request("/api/postagens", { method: "POST", body: formData });
}

export interface TagSugestaoAPI {
    id: number;
    nome: string;
}

export async function apiSugestoesTags(termo: string): Promise<TagSugestaoAPI[]> {
    if (!termo.trim()) return [];
    const data: { sugestoes: TagSugestaoAPI[] } = await request(
        `/api/postagens/tags/sugestoes?termo=${encodeURIComponent(termo.trim())}`
    );
    return data.sugestoes;
}

export async function apiCurtirPostagem(id: number): Promise<{ mensagem: string }> {
    return request(`/api/postagens/${id}/curtir`, { method: "POST" });
}

export async function apiDescurtirPostagem(id: number): Promise<{ mensagem: string }> {
    return request(`/api/postagens/${id}/curtir`, { method: "DELETE" });
}

export async function apiExcluirPostagem(id: number): Promise<{ mensagem: string }> {
    return request(`/api/postagens/${id}`, { method: "DELETE" });
}

export interface TagTendenciaAPI {
    id: number;
    nome: string;
    totalPostagens: number;
}

export async function apiTagsTendencias(): Promise<TagTendenciaAPI[]> {
    const data: { tendencias: TagTendenciaAPI[] } = await request("/api/postagens/tags/tendencias");
    return data.tendencias;
}