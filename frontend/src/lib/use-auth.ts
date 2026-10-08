import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiLogin, apiCadastrar, apiLogout, apiMe, getToken, apiEditarPerfil, apiApagarPerfil, apiAlterarSenha, apiBuscarUsuarioPorEmail, type Usuario } from "./api";

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
        refetchOnWindowFocus: "always",
        refetchInterval: 60 * 1000,
    });
}

export function useLogin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ email, senha, lembrar }: { email: string; senha: string; lembrar?: boolean }) =>
            apiLogin(email, senha, lembrar),
        onSuccess: async () => {
            queryClient.removeQueries({
                predicate: (q) => q.queryKey[0] !== "usuario-atual",
            });

            const usuario = await apiMe();
            queryClient.setQueryData(["usuario-atual"], usuario);
        },
    });
}

export function useCadastro() {
    return useMutation({
        mutationFn: apiCadastrar,
    });
}

export function useEditarPerfil() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: apiEditarPerfil,
        onSuccess: (usuario) => {
            queryClient.setQueryData(["usuario-atual"], usuario);
            queryClient.invalidateQueries({ queryKey: ["postagens"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: apiLogout,
        onSuccess: () => {
            queryClient.clear();
            queryClient.setQueryData(["usuario-atual"], null);
        },
    });
}

export function useApagarPerfil() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (email: string) => apiApagarPerfil(email),
        onSuccess: () => {
            queryClient.setQueryData(["usuario-atual"], null);
            queryClient.clear();
        },
    });
}

export function useAlterarSenha() {
    return useMutation({
        mutationFn: apiAlterarSenha,
    });
}

export function useUsuarioPorEmail(email: string | undefined) {
    return useQuery<Usuario>({
        queryKey: ["usuario-perfil", email],
        queryFn: () => apiBuscarUsuarioPorEmail(email!),
        enabled: !!email,
        staleTime: 60 * 1000,
    });
}