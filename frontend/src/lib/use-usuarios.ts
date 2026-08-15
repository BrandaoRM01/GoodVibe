import { useQuery } from "@tanstack/react-query";
import { apiUsuariosDestaque, type UsuarioDestaqueAPI } from "./usuarios";

export function useUsuariosDestaque(limite = 3) {
    return useQuery<UsuarioDestaqueAPI[]>({
        queryKey: ["usuarios-destaque", limite],
        queryFn: () => apiUsuariosDestaque(limite),
        staleTime: 5 * 60 * 1000,
    });
}