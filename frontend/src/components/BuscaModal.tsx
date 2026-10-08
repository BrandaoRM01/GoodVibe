import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Hash, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AvatarUsuario, PerfilUsuarioLink } from "@/components/UsuarioAdminUI";
import { useBusca } from "@/lib/use-postagens";

export function BuscaModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
    const navigate = useNavigate();
    const [texto, setTexto] = useState("");
    const [termo, setTermo] = useState("");

    useEffect(() => {
        const limpo = texto.trim().replace(/^[@#]+/, "").trim();
        const t = setTimeout(() => setTermo(limpo), 300);
        return () => clearTimeout(t);
    }, [texto]);

    useEffect(() => {
        if (!aberto) {
            setTexto("");
            setTermo("");
        }
    }, [aberto]);

    const { data, isFetching, isError } = useBusca(aberto ? termo : "");

    const usuarios = data?.usuarios ?? [];
    const tags = data?.tags ?? [];
    const semResultados = !!termo && !isFetching && !isError && usuarios.length === 0 && tags.length === 0;

    function filtrarPorAutor(username: string) {
        navigate({ to: "/feed", search: (prev: Record<string, unknown>) => ({ ...prev, autor: username }) });
        onFechar();
    }

    function filtrarPorTag(nome: string) {
        navigate({ to: "/feed", search: (prev: Record<string, unknown>) => ({ ...prev, tag: nome }) });
        onFechar();
    }

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-md h-[70vh] max-h-[560px] rounded-3xl sm:rounded-3xl bg-card border-border">
                <div className="px-5 py-4 border-b border-border space-y-3">
                    <DialogTitle className="text-base text-center">Buscar</DialogTitle>
                    <DialogDescription className="sr-only">
                        Busque usuários pelo nome ou tags para filtrar o feed
                    </DialogDescription>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            autoFocus
                            maxLength={50}
                            placeholder="Buscar usuário ou tag..."
                            className="w-full bg-background border border-border rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {!termo && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Digite um username ou uma tag para buscar.
                        </p>
                    )}

                    {termo && isFetching && usuarios.length === 0 && tags.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">Buscando...</p>
                    )}

                    {isError && (
                        <p className="text-center text-sm text-destructive py-8">Não foi possível realizar a busca.</p>
                    )}

                    {semResultados && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Nada encontrado para “{termo}”.
                        </p>
                    )}

                    {usuarios.length > 0 && (
                        <section className="space-y-2">
                            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Usuários
                            </h3>
                            {usuarios.map((u) => (
                                <div key={u.email} className="flex items-center gap-3">
                                    <PerfilUsuarioLink
                                        email={u.email}
                                        onClick={onFechar}
                                        className="shrink-0 hover:opacity-80 transition-opacity"
                                    >
                                        <AvatarUsuario url={u.url_foto} nome={u.username} />
                                    </PerfilUsuarioLink>
                                    <button
                                        type="button"
                                        onClick={() => filtrarPorAutor(u.username)}
                                        className="flex-1 min-w-0 text-left group"
                                    >
                                        <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                                            {u.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {u.totalPostagens} {u.totalPostagens === 1 ? "boa ação" : "boas ações"}
                                        </p>
                                    </button>
                                </div>
                            ))}
                        </section>
                    )}

                    {tags.length > 0 && (
                        <section className="space-y-2">
                            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Tags
                            </h3>
                            {tags.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => filtrarPorTag(t.nome)}
                                    className="w-full flex items-center gap-3 text-left group"
                                >
                                    <span className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                                        <Hash className="h-4 w-4" />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                                            #{t.nome}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.totalPostagens} {t.totalPostagens === 1 ? "publicação" : "publicações"}
                                        </p>
                                    </span>
                                </button>
                            ))}
                        </section>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}