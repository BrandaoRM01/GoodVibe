import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiLogin, apiCadastrar, apiLogout, apiMe, getToken, type Usuario } from "./api";

export function useUsuarioAtual() {
    return useQuery<Usuario | null>({
        queryKey: ["usuario-atual"],
        queryFn: async () => {
            if (!getToken()) return null;
            try {
                return await apiMe();
            } catch {
                return null;
            }
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useLogin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ email, senha }: { email: string; senha: string }) => apiLogin(email, senha),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["usuario-atual"] });
        },
    });
}

export function useCadastro() {
    return useMutation({
        mutationFn: apiCadastrar,
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: apiLogout,
        onSuccess: () => {
            queryClient.setQueryData(["usuario-atual"], null);
        },
    });
}