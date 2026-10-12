import { request } from "./api";
import type { PostagemAPI } from "./postagens";

export interface UsuarioResumoAPI {
    email: string;
    username: string;
    url_foto: string | null;
}

export interface PostagemCompartilhadaAPI {
    disponivel: boolean;
    id?: number;
    autor?: string;
    autorEmail?: string;
    autorFoto?: string | null;
    conteudo?: string;
    imagem?: string | null;
}

export interface MensagemAPI {
    id: number;
    conversaId: number;
    remetenteEmail: string;
    tipo: "texto" | "postagem";
    conteudo: string | null;
    clientId: string | null;
    lida: boolean;
    criadoEm: string;
    postagem: PostagemCompartilhadaAPI | null;
}

export type MensagemLocal = Omit<MensagemAPI, "id"> & {
    id: number | null;
    status?: "enviando" | "falhou";
    erro?: string;
    local?: number;
};

export interface ConversaListaAPI {
    usuario: UsuarioResumoAPI;
    segueDeVolta: boolean;
    conversaId: number | null;
    naoLidas: number;
    ultimaAtividade: string | null;
    ultimaMensagem: {
        tipo: "texto" | "postagem";
        conteudo: string | null;
        remetenteEmail: string;
    } | null;
}

export interface ConversaAbertaAPI {
    usuario: UsuarioResumoAPI;
    conversaId: number | null;
    mensagens: MensagemAPI[];
    proximoAntes: number | null;
}

export function novoClientId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export async function apiListarConversas(): Promise<ConversaListaAPI[]> {
    const data: { conversas: ConversaListaAPI[] } = await request("/api/mensagens/conversas");
    return data.conversas;
}

export async function apiTotalNaoLidasMensagens(): Promise<number> {
    const data: { total: number } = await request("/api/mensagens/nao-lidas");
    return data.total;
}

export async function apiAbrirConversa(
    email: string,
    params: { antes?: number; depois?: number; limite?: number } = {}
): Promise<ConversaAbertaAPI> {
    const qs = new URLSearchParams();
    if (params.antes !== undefined) qs.set("antes", String(params.antes));
    if (params.depois !== undefined) qs.set("depois", String(params.depois));
    if (params.limite !== undefined) qs.set("limite", String(params.limite));
    const query = qs.toString();

    return request(`/api/mensagens/com/${encodeURIComponent(email)}${query ? `?${query}` : ""}`);
}

export async function apiEnviarMensagem(
    email: string,
    payload: { conteudo?: string; postagemId?: number; clientId: string }
): Promise<MensagemAPI> {
    const data: { mensagem: MensagemAPI } = await request(`/api/mensagens/com/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return data.mensagem;
}

export async function apiMarcarConversaLida(email: string): Promise<void> {
    await request(`/api/mensagens/com/${encodeURIComponent(email)}/lida`, { method: "POST" });
}

export async function apiBuscarPostagemCompartilhada(id: number): Promise<PostagemAPI> {
    const data: { postagem: PostagemAPI } = await request(`/api/mensagens/postagem/${id}`);
    return data.postagem;
}

function comparar(a: MensagemLocal, b: MensagemLocal): number {
    if (a.id !== null && b.id !== null) return a.id - b.id;
    if (a.id !== null) return -1;
    if (b.id !== null) return 1;
    return (a.local ?? 0) - (b.local ?? 0);
}

// Junta mensagens sem duplicar (por id ou por clientId) e mantém a ordem determinística
export function mesclarMensagens(
    atual: MensagemLocal[],
    novas: (MensagemAPI | MensagemLocal)[]
): MensagemLocal[] {
    const lista = [...atual];

    for (const n of novas) {
        const i = lista.findIndex(
            (m) => (n.id !== null && m.id === n.id) || (!!n.clientId && m.clientId === n.clientId)
        );
        if (i >= 0) {
            lista[i] = {
                ...lista[i],
                ...n,
                status: n.id !== null ? undefined : (n as MensagemLocal).status,
                erro: undefined,
            };
        } else {
            lista.push(n as MensagemLocal);
        }
    }

    return lista.sort(comparar);
}

function inicioDoDia(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatarTempoRelativo(iso: string, agora: Date = new Date()): string {
    const t = new Date(iso);
    if (isNaN(t.getTime())) return "";

    const diffMs = Math.max(0, agora.getTime() - t.getTime());
    const min = Math.floor(diffMs / 60000);
    const horas = Math.floor(min / 60);

    if (min < 1) return "Agora";
    if (min < 60) return `Há ${min} ${min === 1 ? "minuto" : "minutos"}`;
    if (horas < 24) return `Há ${horas} ${horas === 1 ? "hora" : "horas"}`;

    const dias = Math.round((inicioDoDia(agora) - inicioDoDia(t)) / 86400000);
    if (dias <= 1) return "Ontem";
    if (dias < 7) return `Há ${dias} dias`;

    return t.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatarHoraMensagem(iso: string): string {
    const t = new Date(iso);
    if (isNaN(t.getTime())) return "";
    return t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatarHoraConversa(iso: string, agora: Date = new Date()): string {
    const t = new Date(iso);
    if (isNaN(t.getTime())) return "";
    if (inicioDoDia(t) === inicioDoDia(agora) && t.getTime() <= agora.getTime()) {
        return formatarHoraMensagem(iso);
    }
    if (t.getTime() > agora.getTime()) return formatarHoraMensagem(iso);
    return formatarTempoRelativo(iso, agora);
}