import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    apiAprovarDenuncia,
    apiCriarDenuncia,
    apiListarDenuncias,
    apiRejeitarDenuncia,
    LIMITE_DENUNCIAS_MODAL,
    LIMITE_DENUNCIAS_PAINEL,
    type PaginaDenuncias,
} from "./denuncias";

export function useCriarDenuncia() {
    return useMutation({ mutationFn: apiCriarDenuncia });
}

export function useDenunciasPainel() {
    return useQuery<PaginaDenuncias>({
        queryKey: ["admin-denuncias", "painel"],
        queryFn: () => apiListarDenuncias(0, LIMITE_DENUNCIAS_PAINEL),
        staleTime: 30 * 1000,
    });
}

// Todas as denúncias, exibidas no modal "Ver mais"
export function useDenunciasAdmin(enabled = true) {
    return useInfiniteQuery<PaginaDenuncias>({
        queryKey: ["admin-denuncias", "todas"],
        queryFn: ({ pageParam }) => apiListarDenuncias(pageParam as number, LIMITE_DENUNCIAS_MODAL),
        initialPageParam: 0,
        getNextPageParam: (ultima) => ultima.proximoOffset ?? undefined,
        enabled,
    });
}

function useInvalidarAposModeracao() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ["admin-denuncias"] });
        queryClient.invalidateQueries({ queryKey: ["admin-resumo"] });
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        queryClient.invalidateQueries({ queryKey: ["comentarios"] });
        queryClient.invalidateQueries({ queryKey: ["usuarios-destaque"] });
    };
}

export function useAprovarDenuncia() {
    const invalidar = useInvalidarAposModeracao();
    return useMutation({ mutationFn: (id: number) => apiAprovarDenuncia(id), onSuccess: invalidar });
}

export function useRejeitarDenuncia() {
    const invalidar = useInvalidarAposModeracao();
    return useMutation({ mutationFn: (id: number) => apiRejeitarDenuncia(id), onSuccess: invalidar });
}