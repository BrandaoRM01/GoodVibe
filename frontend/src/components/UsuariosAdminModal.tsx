import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AvatarUsuario, TipoUsuarioBadge, PerfilUsuarioLink } from "@/components/UsuarioAdminUI";
import { useUsuariosAdmin } from "@/lib/use-admin";
import { ROTULO_TIPO_USUARIO, type FiltroTipoUsuario, type TipoUsuario } from "@/lib/admin";
import { AcoesUsuarioAdmin } from "@/components/AcoesUsuarioAdmin";

function useDebounce<T>(valor: T, atrasoMs = 350) {
    const [debounced, setDebounced] = useState(valor);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(valor), atrasoMs);
        return () => clearTimeout(t);
    }, [valor, atrasoMs]);

    return debounced;
}

export function UsuariosAdminModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
    const [busca, setBusca] = useState("");
    const [tipo, setTipo] = useState<FiltroTipoUsuario>("todos");
    const buscaDebounced = useDebounce(busca.trim());

    const { data, isLoading, isError, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useUsuariosAdmin(buscaDebounced, tipo, aberto);

    const usuarios = data?.pages.flatMap((p) => p.usuarios) ?? [];
    const total = data?.pages[0]?.total ?? 0;
    const filtrando = isFetching && !isFetchingNextPage;

    useEffect(() => {
        if (!aberto) {
            setBusca("");
            setTipo("todos");
        }
    }, [aberto]);

    const campoClasse =
        "bg-background border border-border rounded-full py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40";

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-xl h-[85vh] max-h-[760px] rounded-3xl sm:rounded-3xl bg-card border-border">
                <div className="px-5 py-4 border-b border-border text-center">
                    <DialogTitle className="text-base">Todos os usuários</DialogTitle>
                    <DialogDescription className="sr-only">
                        Lista de usuários ordenada por boas ações, com filtro por username e por tipo de usuário
                    </DialogDescription>
                </div>

                <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Filtrar por username..."
                            className={`${campoClasse} w-full pl-10 pr-4`}
                        />
                    </div>

                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as FiltroTipoUsuario)}
                        aria-label="Filtrar por tipo de usuário"
                        className={`${campoClasse} px-4`}
                    >
                        <option value="todos">Todos</option>
                        {(Object.keys(ROTULO_TIPO_USUARIO) as TipoUsuario[]).map((t) => (
                            <option key={t} value={t}>
                                {ROTULO_TIPO_USUARIO[t]}
                            </option>
                        ))}
                    </select>
                </div>

                <div
                    className={`flex-1 overflow-y-auto px-5 py-4 space-y-4 transition-opacity ${filtrando ? "opacity-60" : ""}`}
                >
                    {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Carregando usuários...</p>}

                    {isError && (
                        <p className="text-center text-sm text-destructive py-8">Não foi possível carregar os usuários.</p>
                    )}

                    {!isLoading && !isError && usuarios.length === 0 && (
                        <div className="text-center py-12">
                            <p className="font-semibold">Nenhum usuário encontrado</p>
                            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros.</p>
                        </div>
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

                            <div className="flex-1 min-w-0">
                                <PerfilUsuarioLink
                                    email={u.email}
                                    onClick={onFechar}
                                    className="block text-sm font-semibold truncate hover:underline"
                                >
                                    {u.username}
                                </PerfilUsuarioLink>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>

                            <div className="text-right shrink-0 w-14">
                                <p className="text-sm font-semibold leading-tight">{u.totalPostagens}</p>
                                <p className="text-[10px] text-muted-foreground">boas ações</p>
                            </div>

                            <TipoUsuarioBadge tipo={u.tipo_usuario} />

                            <AcoesUsuarioAdmin usuario={u} />
                        </div>
                    ))}

                    {hasNextPage && (
                        <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="block mx-auto text-sm font-semibold text-primary hover:underline disabled:opacity-60"
                        >
                            {isFetchingNextPage ? "Carregando..." : "Ver mais usuários"}
                        </button>
                    )}
                </div>

                {!isLoading && !isError && (
                    <div className="border-t border-border px-5 py-2.5 text-center text-xs text-muted-foreground">
                        Exibindo {usuarios.length} de {total} {total === 1 ? "usuário" : "usuários"}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}