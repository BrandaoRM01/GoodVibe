import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AvatarUsuario } from "@/components/UsuarioAdminUI";
import { ApiError } from "@/lib/api";
import { apiEnviarMensagem, novoClientId, type UsuarioResumoAPI } from "@/lib/mensagens";
import { useConversas } from "@/lib/use-mensagens";

interface CompartilharModalProps {
    postagemId: number;
    aberto: boolean;
    onFechar: () => void;
    onEnviado: () => void;
}

// Lista apenas quem o usuário segue (a mesma regra da tela de mensagens)
export function CompartilharModal({ postagemId, aberto, onFechar, onEnviado }: CompartilharModalProps) {
    const { data, isLoading, isError, refetch } = useConversas();
    const [busca, setBusca] = useState("");
    const [enviando, setEnviando] = useState<string | null>(null);
    const [enviados, setEnviados] = useState<string[]>([]);

    useEffect(() => {
        if (!aberto) {
            setBusca("");
            setEnviando(null);
            setEnviados([]);
        }
    }, [aberto]);

    const termo = busca.trim().toLowerCase();
    const usuarios = (data ?? [])
        .map((c) => c.usuario)
        .filter((u) => !termo || u.username.toLowerCase().includes(termo));

    async function enviar(u: UsuarioResumoAPI) {
        if (enviando) return;
        setEnviando(u.email);
        try {
            await apiEnviarMensagem(u.email, { postagemId, clientId: novoClientId() });
            setEnviados((atual) => [...atual, u.email]);
            onEnviado();
            toast.success(`Publicação enviada para ${u.username}.`);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente.");
        } finally {
            setEnviando(null);
        }
    }

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-md h-[70vh] max-h-[560px] rounded-3xl sm:rounded-3xl bg-card border-border">
                <div className="px-5 py-4 border-b border-border space-y-3">
                    <DialogTitle className="text-base text-center">Enviar para</DialogTitle>
                    <DialogDescription className="sr-only">
                        Escolha uma pessoa que você segue para receber esta publicação
                    </DialogDescription>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            maxLength={50}
                            placeholder="Buscar pessoa..."
                            className="w-full bg-background border border-border rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {isLoading && (
                        <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
                    )}

                    {isError && (
                        <div className="text-center py-8 space-y-2">
                            <p className="text-sm text-destructive">Não foi possível carregar seus contatos.</p>
                            <button type="button" onClick={() => refetch()} className="text-xs font-semibold text-primary">
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {!isLoading && !isError && (data ?? []).length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Você ainda não segue ninguém. Siga pessoas para compartilhar publicações com elas.
                        </p>
                    )}

                    {!isLoading && !isError && (data ?? []).length > 0 && usuarios.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Nenhuma pessoa encontrada para “{busca.trim()}”.
                        </p>
                    )}

                    {usuarios.map((u) => {
                        const jaEnviado = enviados.includes(u.email);
                        return (
                            <div key={u.email} className="flex items-center gap-3">
                                <AvatarUsuario url={u.url_foto} nome={u.username} className="h-10 w-10" />
                                <p className="flex-1 min-w-0 text-sm font-semibold truncate">{u.username}</p>
                                <button
                                    type="button"
                                    onClick={() => enviar(u)}
                                    disabled={jaEnviado || enviando !== null}
                                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-60 ${jaEnviado
                                            ? "bg-card border border-border"
                                            : "bg-primary text-primary-foreground shadow-soft hover:shadow-glow"
                                        }`}
                                >
                                    {jaEnviado ? "Enviado" : enviando === u.email ? "Enviando..." : "Enviar"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}