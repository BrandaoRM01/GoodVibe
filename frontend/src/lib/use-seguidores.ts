import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "./api";
import {
    apiDeixarDeSeguir,
    apiIdsSeguindo,
    apiListarRede,
    apiSeguir,
    apiRemoverSeguidor,
    type OrdemRede,
    type PaginaRede,
    type TipoRede,
} from "./seguidores";

const CHAVE_IDS = ["seguindo-ids"];

export function useIdsSeguindo() {
    return useQuery<string[]>({
        queryKey: CHAVE_IDS,
        queryFn: apiIdsSeguindo,
        enabled: !!getToken(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useAlternarSeguir() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ email, seguir }: { email: string; seguir: boolean }) =>
            seguir ? apiSeguir(email) : apiDeixarDeSeguir(email),
        onMutate: async ({ email, seguir }) => {
            await queryClient.cancelQueries({ queryKey: CHAVE_IDS });
            const anterior = queryClient.getQueryData<string[]>(CHAVE_IDS);

            queryClient.setQueryData<string[]>(CHAVE_IDS, (old = []) =>
                seguir ? (old.includes(email) ? old : [...old, email]) : old.filter((e) => e !== email)
            );

            return { anterior };
        },
        onError: (_err, _vars, contexto) => {
            if (contexto?.anterior) queryClient.setQueryData(CHAVE_IDS, contexto.anterior);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CHAVE_IDS });
            queryClient.invalidateQueries({ queryKey: ["usuario-atual"] });
            queryClient.invalidateQueries({ queryKey: ["usuario-perfil"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["busca"] });
        },
    });
}

export function useRedeUsuarios(
    email: string,
    tipo: TipoRede,
    filtros: { busca: string; ordem: OrdemRede },
    habilitado: boolean
) {
    return useInfiniteQuery<PaginaRede>({
        queryKey: ["rede", email, tipo, filtros.busca, filtros.ordem],
        queryFn: ({ pageParam }) =>
            apiListarRede(email, tipo, { ...filtros, offset: pageParam as number }),
        initialPageParam: 0,
        getNextPageParam: (ultima) => ultima.proximoOffset ?? undefined,
        enabled: habilitado && !!email,
    });
}

export function useRemoverSeguidor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (email: string) => apiRemoverSeguidor(email),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rede"] });
            queryClient.invalidateQueries({ queryKey: ["usuario-atual"] });
            queryClient.invalidateQueries({ queryKey: ["usuario-perfil"] });
        },
    });
}