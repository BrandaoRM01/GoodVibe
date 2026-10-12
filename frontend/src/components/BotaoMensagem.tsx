import { useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useUsuarioAtual } from "@/lib/use-auth";
import { useIdsSeguindo } from "@/lib/use-seguidores";

export function BotaoMensagem({ email, username }: { email: string; username: string }) {
    const navigate = useNavigate();
    const { data: usuarioAtual } = useUsuarioAtual();
    const { data: ids } = useIdsSeguindo();

    if (!usuarioAtual || usuarioAtual.email === email) return null;

    const seguindo = ids?.includes(email) ?? false;

    function abrir() {
        if (ids === undefined) return;
        if (!seguindo) {
            toast.info(`Siga ${username} para poder enviar mensagens.`);
            return;
        }
        navigate({ to: "/messages", search: { com: email } });
    }

    return (
        <button
            type="button"
            onClick={abrir}
            disabled={ids === undefined}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-card border border-border hover:bg-accent transition-all disabled:opacity-60 ${seguindo ? "" : "text-muted-foreground"
                }`}
        >
            <MessageCircle className="h-4 w-4" />
            Mensagem
        </button>
    );
}