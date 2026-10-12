import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUsuarioAtual } from "@/lib/use-auth";
import { conectarTempoReal } from "@/lib/tempo-real";
import type { NotificacaoAPI } from "@/lib/notificacoes";

function estaNaConversa(email: string): boolean {
    if (window.location.pathname !== "/messages") return false;
    const com = new URLSearchParams(window.location.search).get("com");
    return com?.toLowerCase() === email.toLowerCase();
}

// Mantém a conexão em tempo real e sincroniza caches e avisos em qualquer página autenticada
export function GerenciadorTempoReal() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data: usuario } = useUsuarioAtual();
    const meuEmail = usuario?.email;

    useEffect(() => {
        if (!meuEmail) return;
        const socket = conectarTempoReal();
        if (!socket) return;

        const sincronizar = () => {
            queryClient.invalidateQueries({ queryKey: ["mensagens"] });
            queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
        };

        const aoNotificacao = (d: { notificacao: NotificacaoAPI }) => {
            const n = d.notificacao;
            queryClient.invalidateQueries({ queryKey: ["notificacoes"] });

            if (n.tipo === "mensagem" && n.autor && estaNaConversa(n.autor.email)) return;

            // Mesmo id = o aviso anterior é atualizado em vez de empilhar outro
            const id = `notificacao-${n.id}`;
            if (n.tipo === "seguidor" && n.autor) {
                const email = n.autor.email;
                toast(`${n.autor.username} começou a seguir você`, {
                    id,
                    action: { label: "Ver", onClick: () => navigate({ to: "/profile/$email", params: { email } }) },
                });
            } else if (n.tipo === "mensagem" && n.autor) {
                const email = n.autor.email;
                const titulo =
                    n.qtd > 1
                        ? `${n.qtd} novas mensagens de ${n.autor.username}`
                        : `Nova mensagem de ${n.autor.username}`;
                toast(titulo, {
                    id,
                    action: { label: "Abrir", onClick: () => navigate({ to: "/messages", search: { com: email } }) },
                });
            } else if (n.tipo === "denuncia") {
                toast("Nova denúncia registrada", {
                    id,
                    action: { label: "Analisar", onClick: () => navigate({ to: "/admin" }) },
                });
            }
        };

        socket.on("mensagem:nova", sincronizar);
        socket.on("mensagens:lidas", sincronizar);
        socket.on("conversas:atualizar", sincronizar);
        socket.on("notificacao:nova", aoNotificacao);
        // Depois de uma queda, busca o que foi perdido
        socket.io.on("reconnect", sincronizar);

        return () => {
            socket.off("mensagem:nova", sincronizar);
            socket.off("mensagens:lidas", sincronizar);
            socket.off("conversas:atualizar", sincronizar);
            socket.off("notificacao:nova", aoNotificacao);
            socket.io.off("reconnect", sincronizar);
        };
    }, [meuEmail, queryClient, navigate]);

    return null;
}