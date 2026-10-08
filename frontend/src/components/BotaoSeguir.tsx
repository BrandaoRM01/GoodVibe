import type { MouseEvent } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useUsuarioAtual } from "@/lib/use-auth";
import { useAlternarSeguir, useIdsSeguindo } from "@/lib/use-seguidores";

interface BotaoSeguirProps {
    email?: string;
    variante?: "pill" | "texto";
    grande?: boolean;
}

export function BotaoSeguir({ email, variante = "pill", grande = false }: BotaoSeguirProps) {
    const { data: usuarioAtual } = useUsuarioAtual();
    const { data: ids } = useIdsSeguindo();
    const alternar = useAlternarSeguir();

    if (!email || !usuarioAtual || usuarioAtual.email === email) return null;

    const seguindo = ids?.includes(email) ?? false;
    const desabilitado = ids === undefined || alternar.isPending;

    function handleClick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!email) return;

        alternar.mutate(
            { email, seguir: !seguindo },
            {
                onError: (err) =>
                    toast.error(
                        err instanceof ApiError ? err.message : "Não foi possível atualizar. Tente novamente."
                    ),
            }
        );
    }

    if (variante === "texto") {
        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={desabilitado}
                className={`font-semibold disabled:opacity-60 ${seguindo ? "text-primary" : "hover:text-foreground"}`}
            >
                {seguindo ? "Seguindo" : "Seguir"}
            </button>
        );
    }

    const tamanho = grande ? "px-5 py-2.5 text-sm gap-2" : "px-3.5 py-1.5 text-xs gap-1.5";
    const estilo = seguindo
        ? "bg-card border border-border hover:border-destructive/50 hover:text-destructive"
        : "bg-primary text-primary-foreground shadow-soft hover:shadow-glow";

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={desabilitado}
            className={`group inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition-all disabled:opacity-60 ${tamanho} ${estilo}`}
        >
            {grande && (seguindo ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />)}
            {seguindo ? (
                grande ? (
                    <>
                        <span className="group-hover:hidden">Seguindo</span>
                        <span className="hidden group-hover:inline">Deixar de seguir</span>
                    </>
                ) : (
                    "Seguindo"
                )
            ) : (
                "Seguir"
            )}
        </button>
    );
}