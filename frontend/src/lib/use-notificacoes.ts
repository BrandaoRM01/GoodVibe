import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "./api";
import {
    apiExcluirNotificacao,
    apiExcluirTodasNotificacoes,
    apiListarNotificacoes,
    apiMarcarNotificacaoLida,
    apiMarcarTodasNotificacoesLidas,
    apiTotalNaoLidasNotificacoes,
    type PaginaNotificacoes,
} from "./notificacoes";

export function useNotificacoes(habilitado: boolean) {
    return useInfiniteQuery<PaginaNotificacoes>({
        queryKey: ["notificacoes", "lista"],
        queryFn: ({ pageParam }) => apiListarNotificacoes(pageParam as number),
        initialPageParam: 0,
        getNextPageParam: (ultima) => ultima.proximoOffset ?? undefined,
        enabled: habilitado && !!getToken(),
    });
}

export function useNaoLidasNotificacoes() {
    return useQuery<number>({
        queryKey: ["notificacoes", "nao-lidas"],
        queryFn: apiTotalNaoLidasNotificacoes,
        enabled: !!getToken(),
        staleTime: 30 * 1000,
    });
}

export function useMarcarNotificacaoLida() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiMarcarNotificacaoLida(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
    });
}

export function useMarcarTodasNotificacoesLidas() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: apiMarcarTodasNotificacoesLidas,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
    });
}

export function useExcluirNotificacao() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiExcluirNotificacao(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
    });
}

export function useExcluirTodasNotificacoes() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: apiExcluirTodasNotificacoes,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
    });
}