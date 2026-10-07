import { useState } from "react";
import { API_URL } from "@/lib/api";
import { ROTULO_TIPO_USUARIO, type TipoUsuario } from "@/lib/admin";
import { Link } from "@tanstack/react-router";

export function AvatarUsuario({
    url,
    nome,
    className = "h-9 w-9",
}: {
    url?: string | null;
    nome: string;
    className?: string;
}) {
    const [falhou, setFalhou] = useState(false);

    return (
        <div
            className={`${className} rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-xs shrink-0 overflow-hidden`}
        >
            {url && !falhou ? (
                <img
                    src={`${API_URL}/${url}`}
                    alt=""
                    onError={() => setFalhou(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                (nome.charAt(0).toUpperCase() || "?")
            )}
        </div>
    );
}

const ESTILOS_TIPO: Record<TipoUsuario, string> = {
    user: "bg-muted text-muted-foreground",
    admin: "bg-success/15 text-success",
    superadmin: "bg-primary/15 text-primary",
};

export function TipoUsuarioBadge({ tipo }: { tipo: TipoUsuario }) {
    return (
        <span
            className={`inline-flex w-[84px] shrink-0 items-center justify-center text-[10px] font-semibold px-2 py-1 rounded-full ${ESTILOS_TIPO[tipo] ?? ESTILOS_TIPO.user}`}
        >
            {ROTULO_TIPO_USUARIO[tipo] ?? tipo}
        </span>
    );
}

export function PerfilUsuarioLink({
    email,
    className,
    onClick,
    children,
}: {
    email: string;
    className?: string;
    onClick?: () => void;
    children: React.ReactNode;
}) {
    return (
        <Link to="/profile/$email" params={{ email }} onClick={onClick} className={className}>
            {children}
        </Link>
    );
}