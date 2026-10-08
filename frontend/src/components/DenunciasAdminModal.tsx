import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ItemDenuncia } from "@/components/DenunciasAdminUI";
import { useDenunciasAdmin } from "@/lib/use-denuncias";

export function DenunciasAdminModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useDenunciasAdmin(aberto);

    const denuncias = data?.pages.flatMap((p) => p.denuncias) ?? [];
    const total = data?.pages[0]?.total ?? 0;

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-xl h-[85vh] max-h-[760px] rounded-3xl sm:rounded-3xl bg-card border-border">
                <div className="px-5 py-4 border-b border-border text-center">
                    <DialogTitle className="text-base">Todas as denúncias</DialogTitle>
                    <DialogDescription className="sr-only">
                        Lista de denúncias de postagens e comentários aguardando análise
                    </DialogDescription>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Carregando denúncias...</p>}

                    {isError && (
                        <p className="text-center text-sm text-destructive py-8">Não foi possível carregar as denúncias.</p>
                    )}

                    {!isLoading && !isError && denuncias.length === 0 && (
                        <div className="text-center py-12">
                            <p className="font-semibold">Nenhuma denúncia pendente</p>
                            <p className="text-sm text-muted-foreground mt-1">A comunidade está tranquila por aqui.</p>
                        </div>
                    )}

                    {denuncias.map((d) => (
                        <ItemDenuncia key={d.id} d={d} onNavegar={onFechar} expansivel />
                    ))}

                    {hasNextPage && (
                        <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="block mx-auto text-sm font-semibold text-primary hover:underline disabled:opacity-60"
                        >
                            {isFetchingNextPage ? "Carregando..." : "Ver mais denúncias"}
                        </button>
                    )}
                </div>

                {!isLoading && !isError && (
                    <div className="border-t border-border px-5 py-2.5 text-center text-xs text-muted-foreground">
                        Exibindo {denuncias.length} de {total} {total === 1 ? "denúncia" : "denúncias"}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}