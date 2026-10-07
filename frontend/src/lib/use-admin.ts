import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    apiAlterarPermissao,
    apiExcluirUsuario,
    apiListarUsuariosAdmin,
    apiResumoAdmin,
    type FiltroTipoUsuario,
    type PaginaUsuariosRanking,
    type ResumoAdminAPI,
} from "./admin";

export function useResumoAdmin() {
    return useQuery<ResumoAdminAPI>({
        queryKey: ["admin-resumo"],
        queryFn: apiResumoAdmin,
        staleTime: 60 * 1000,
    });
}

export function useUsuariosAdmin(busca: string, tipo: FiltroTipoUsuario, enabled = true) {
    return useInfiniteQuery<PaginaUsuariosRanking>({
        queryKey: ["admin-usuarios", busca, tipo],
        queryFn: ({ pageParam }) => apiListarUsuariosAdmin({ busca, tipo, offset: pageParam as number }),
        initialPageParam: 0,
        getNextPageParam: (ultima) => ultima.proximoOffset ?? undefined,
        placeholderData: keepPreviousData,
        enabled,
    });
}

export function useAlterarPermissao() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (email: string) => apiAlterarPermissao(email),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-resumo"] });
            queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
            queryClient.invalidateQueries({ queryKey: ["usuario-perfil"] });
        },
    });
}

export function useExcluirUsuario() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (email: string) => apiExcluirUsuario(email),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-resumo"] });
            queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
            queryClient.invalidateQueries({ queryKey: ["usuarios-destaque"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["postagens"] });
        },
    });
}