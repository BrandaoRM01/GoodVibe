import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUsuarioAtual } from "@/lib/use-auth";

export function ehAdmin(usuario?: { tipo_usuario?: string } | null) {
    return usuario?.tipo_usuario === "admin" || usuario?.tipo_usuario === "superadmin";
}

export function RotaProtegida({
    children,
    apenasAdmin = false,
}: {
    children: ReactNode;
    apenasAdmin?: boolean;
}) {
    const { data: usuario, isLoading } = useUsuarioAtual();
    const navigate = useNavigate();

    const semLogin = !isLoading && !usuario;
    const semPermissao = !isLoading && !!usuario && apenasAdmin && !ehAdmin(usuario);

    useEffect(() => {
        if (semLogin) navigate({ to: "/login", replace: true });
        else if (semPermissao) navigate({ to: "/feed", replace: true });
    }, [semLogin, semPermissao, navigate]);

    // Não renderiza nada enquanto carrega ou redireciona (evita "piscar" a página protegida)
    if (isLoading || semLogin || semPermissao) return null;

    return <>{children}</>;
}