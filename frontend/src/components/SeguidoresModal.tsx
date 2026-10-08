import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useUsuarioAtual } from "@/lib/use-auth";
import { useRedeUsuarios, useRemoverSeguidor } from "@/lib/use-seguidores";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AvatarUsuario, PerfilUsuarioLink } from "@/components/UsuarioAdminUI";
import { BotaoSeguir } from "@/components/BotaoSeguir";
import type { OrdemRede, TipoRede } from "@/lib/seguidores";

function formatarData(dataStr: string | null): string {
    if (!dataStr) return "";
    const data = new Date(dataStr.includes("T") ? dataStr : dataStr.replace(" ", "T"));
    if (isNaN(data.getTime())) return "";
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

interface SeguidoresModalProps {
    email: string;
    username: string;
    aberto: boolean;
    aba: TipoRede;
    onMudarAba: (aba: TipoRede) => void;
    onFechar: () => void;
    qtdSeguidores: number;
    qtdSeguindo: number;
}

export function SeguidoresModal({
    email,
    username,
    aberto,
    aba,
    onMudarAba,
    onFechar,
    qtdSeguidores,
    qtdSeguindo,
}: SeguidoresModalProps) {
    const [texto, setTexto] = useState("");
    const [busca, setBusca] = useState("");
    const [ordem, setOrdem] = useState<OrdemRede>("recentes");

    useEffect(() => {
        const t = setTimeout(() => setBusca(texto.trim().replace(/^@+/, "")), 300);
        return () => clearTimeout(t);
    }, [texto]);

    useEffect(() => {
        if (!aberto) {
            setTexto("");
            setBusca("");
            setOrdem("recentes");
        }
    }, [aberto]);

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useRedeUsuarios(
        email,
        aba,
        { busca, ordem },
        aberto
    );

    const usuarios = data?.pages.flatMap((p) => p.usuarios) ?? [];

    const abas: { id: TipoRede; label: string }[] = [
        { id: "seguidores", label: `${qtdSeguidores} ${qtdSeguidores === 1 ? "seguidor" : "seguidores"}` },
        { id: "seguindo", label: `${qtdSeguindo} seguindo` },
    ];

    const { data: usuarioAtual } = useUsuarioAtual();
    const removerSeguidor = useRemoverSeguidor();
    const possoRemover = aba === "seguidores" && usuarioAtual?.email === email;

    function handleRemover(emailSeguidor: string, nome: string) {
        if (!window.confirm(`Remover ${nome} dos seus seguidores?`)) return;

        removerSeguidor.mutate(emailSeguidor, {
            onSuccess: () => toast.success("Seguidor removido."),
            onError: (err) =>
                toast.error(err instanceof ApiError ? err.message : "Não foi possível remover. Tente novamente."),
        });
    }

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-md h-[80vh] max-h-[640px] rounded-3xl sm:rounded-3xl bg-card border-border">
                <div className="px-5 pt-4 pb-3 border-b border-border space-y-3">
                    <DialogTitle className="text-base text-center">@{username}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Lista de seguidores e de quem {username} segue
                    </DialogDescription>

                    <div className="grid grid-cols-2 gap-2">
                        {abas.map((a) => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => onMudarAba(a.id)}
                                className={`rounded-full py-2 text-sm font-semibold transition-colors ${aba === a.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border border-border hover:bg-accent"
                                    }`}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                maxLength={50}
                                placeholder="Filtrar por username..."
                                className="w-full bg-background border border-border rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        <select
                            value={ordem}
                            onChange={(e) => setOrdem(e.target.value as OrdemRede)}
                            aria-label="Ordenar por data"
                            className="bg-background border border-border rounded-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            <option value="recentes">Mais recentes</option>
                            <option value="antigos">Mais antigos</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>}

                    {isError && (
                        <p className="text-center text-sm text-destructive py-8">Não foi possível carregar a lista.</p>
                    )}

                    {!isLoading && !isError && usuarios.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            {busca
                                ? `Nenhum usuário encontrado para “${busca}”.`
                                : aba === "seguidores"
                                    ? "Ainda não há seguidores."
                                    : "Ainda não segue ninguém."}
                        </p>
                    )}

                    {usuarios.map((u) => (
                        <div key={u.email} className="flex items-center gap-3">
                            <PerfilUsuarioLink
                                email={u.email}
                                onClick={onFechar}
                                className="shrink-0 hover:opacity-80 transition-opacity"
                            >
                                <AvatarUsuario url={u.url_foto} nome={u.username} className="h-10 w-10" />
                            </PerfilUsuarioLink>

                            <PerfilUsuarioLink email={u.email} onClick={onFechar} className="flex-1 min-w-0 group">
                                <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                                    {u.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {aba === "seguidores" ? "Seguiu em" : "Seguindo desde"} {formatarData(u.seguidoEm)}
                                </p>
                            </PerfilUsuarioLink>

                            <BotaoSeguir email={u.email} />
                            {possoRemover && (
                                <button
                                    type="button"
                                    onClick={() => handleRemover(u.email, u.username)}
                                    disabled={removerSeguidor.isPending}
                                    aria-label={`Remover ${u.username} dos seguidores`}
                                    title="Remover seguidor"
                                    className="h-8 w-8 shrink-0 rounded-full grid place-items-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}

                    {hasNextPage && (
                        <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="block mx-auto text-sm font-semibold text-primary hover:underline disabled:opacity-60"
                        >
                            {isFetchingNextPage ? "Carregando..." : "Ver mais"}
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}