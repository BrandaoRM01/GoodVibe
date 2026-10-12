import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCheck, Flag, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AvatarUsuario } from "@/components/UsuarioAdminUI";
import { useAgora } from "@/lib/use-mensagens";
import {
    useExcluirNotificacao,
    useExcluirTodasNotificacoes,
    useMarcarNotificacaoLida,
    useMarcarTodasNotificacoesLidas,
    useNotificacoes,
} from "@/lib/use-notificacoes";
import { formatarTempoRelativo } from "@/lib/mensagens";
import type { NotificacaoAPI } from "@/lib/notificacoes";

function textoNotificacao(n: NotificacaoAPI): ReactNode {
    const nome = <strong className="font-semibold">{n.autor?.username ?? "Alguém"}</strong>;

    if (n.tipo === "seguidor") return <>{nome} começou a seguir você</>;
    if (n.tipo === "mensagem") {
        return n.qtd > 1 ? (
            <>
                {n.qtd} novas mensagens de {nome}
            </>
        ) : (
            <>Nova mensagem de {nome}</>
        );
    }
    return <>Nova denúncia registrada. Toque para analisar.</>;
}

export function NotificacoesModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
    const navigate = useNavigate();
    const agora = useAgora();
    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
        useNotificacoes(aberto);
    const marcarLida = useMarcarNotificacaoLida();
    const marcarTodas = useMarcarTodasNotificacoesLidas();
    const excluir = useExcluirNotificacao();
    const excluirTodas = useExcluirTodasNotificacoes();

    const itens = data?.pages.flatMap((p) => p.notificacoes) ?? [];
    const naoLidas = data?.pages[0]?.naoLidas ?? 0;

    function abrir(n: NotificacaoAPI) {
        if (!n.lida) marcarLida.mutate(n.id);
        onFechar();

        if (n.tipo === "seguidor" && n.autor) {
            navigate({ to: "/profile/$email", params: { email: n.autor.email } });
        } else if (n.tipo === "mensagem" && n.autor) {
            navigate({ to: "/messages", search: { com: n.autor.email } });
        } else if (n.tipo === "denuncia") {
            navigate({ to: "/admin" });
        }
    }

    function limparTodas() {
        if (itens.length === 0) return;
        if (!window.confirm("Excluir todas as notificações?")) return;
        excluirTodas.mutate();
    }

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-md h-[70vh] max-h-[560px] rounded-3xl sm:rounded-3xl bg-card border-border">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                    <DialogTitle className="text-base">Notificações</DialogTitle>
                    <DialogDescription className="sr-only">
                        Novos seguidores, mensagens e avisos da plataforma
                    </DialogDescription>
                    <div className="mr-6 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => marcarTodas.mutate()}
                            disabled={naoLidas === 0 || marcarTodas.isPending}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary disabled:opacity-40"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Marcar como lidas
                        </button>
                        <button
                            type="button"
                            onClick={limparTodas}
                            disabled={itens.length === 0 || excluirTodas.isPending}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive disabled:opacity-40"
                        >
                            <Trash2 className="h-4 w-4" />
                            Limpar
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                    {isLoading && (
                        <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
                    )}

                    {isError && (
                        <div className="text-center py-8 space-y-2">
                            <p className="text-sm text-destructive">Não foi possível carregar as notificações.</p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="text-xs font-semibold text-primary"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {!isLoading && !isError && itens.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Tudo tranquilo por aqui. Quando algo acontecer, você verá neste lugar. 💛
                        </p>
                    )}

                    {itens.map((n) => (
                        <div
                            key={n.id}
                            className={`group flex items-center gap-1 rounded-2xl transition-colors hover:bg-accent ${n.lida ? "" : "bg-primary/5"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => abrir(n)}
                                className="flex-1 min-w-0 flex items-center gap-3 p-3 text-left"
                            >
                                {n.tipo === "denuncia" ? (
                                    <span className="h-10 w-10 rounded-full bg-destructive/10 text-destructive grid place-items-center shrink-0">
                                        <Flag className="h-4 w-4" />
                                    </span>
                                ) : (
                                    <AvatarUsuario url={n.autor?.url_foto} nome={n.autor?.username ?? "?"} className="h-10 w-10" />
                                )}
                                <span className="flex-1 min-w-0">
                                    <p className="text-sm leading-snug">{textoNotificacao(n)}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {formatarTempoRelativo(n.criadoEm, agora)}
                                    </p>
                                </span>
                                {!n.lida && <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => excluir.mutate(n.id)}
                                disabled={excluir.isPending}
                                aria-label="Excluir notificação"
                                title="Excluir notificação"
                                className="mr-2 h-8 w-8 shrink-0 grid place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {hasNextPage && (
                        <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="w-full text-xs font-semibold text-primary py-3 disabled:opacity-60"
                        >
                            {isFetchingNextPage ? "Carregando..." : "Ver mais"}
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}