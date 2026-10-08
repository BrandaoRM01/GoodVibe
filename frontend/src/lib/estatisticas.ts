import { request } from "./api";

export interface EstatisticasPublicasAPI {
    totalUsuarios: number;
    usuariosAtivos: number;
    boasAcoesTotal: number;
    boasAcoesHoje: number;
    engajamento: number;
}

export async function apiEstatisticasPublicas(): Promise<EstatisticasPublicasAPI> {
    return request("/api/usuarios/publico/estatisticas");
}

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

/** 950 -> "950" | 1200 -> "1,2 mil" | 2300000 -> "2,3 mi" */
export function formatarNumero(n: number) {
    return n < 1000 ? n.toLocaleString("pt-BR") : compacto.format(n);
}