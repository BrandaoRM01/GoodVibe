import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AvatarUsuario } from "@/components/UsuarioAdminUI";
import { PostCard } from "@/components/PostCard";
import { mapPostagemParaPost } from "@/components/ProfileView";
import { API_URL } from "@/lib/api";
import { apiBuscarPostagemCompartilhada, type PostagemCompartilhadaAPI } from "@/lib/mensagens";

function PostagemModal({ id, aberto, onFechar }: { id: number; aberto: boolean; onFechar: () => void }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["postagem-compartilhada", id],
        queryFn: () => apiBuscarPostagemCompartilhada(id),
        enabled: aberto,
        retry: false,
    });

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-xl max-h-[85vh] rounded-3xl sm:rounded-3xl bg-card border-border">
                <div className="px-5 py-4 border-b border-border">
                    <DialogTitle className="text-base text-center">Publicação</DialogTitle>
                    <DialogDescription className="sr-only">Publicação compartilhada na conversa</DialogDescription>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>}
                    {isError && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Esta publicação não está mais disponível.
                        </p>
                    )}
                    {data && <PostCard post={mapPostagemParaPost(data)} />}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function CartaoPostagemCompartilhada({ postagem }: { postagem: PostagemCompartilhadaAPI }) {
    const [aberto, setAberto] = useState(false);

    if (!postagem.disponivel || !postagem.id) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-xs text-muted-foreground">
                Esta publicação não está mais disponível.
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setAberto(true)}
                className="block w-64 max-w-full text-left rounded-2xl overflow-hidden bg-card text-foreground border border-border shadow-soft hover:border-primary/40 transition-colors"
            >
                {postagem.imagem && (
                    <img
                        src={`${API_URL}/${postagem.imagem}`}
                        alt=""
                        className="w-full aspect-[16/10] object-cover"
                    />
                )}
                <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <AvatarUsuario url={postagem.autorFoto} nome={postagem.autor ?? "?"} className="h-6 w-6" />
                        <span className="text-xs font-semibold truncate">{postagem.autor}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">{postagem.conteudo}</p>
                    <span className="text-[11px] font-semibold text-primary">Ver publicação</span>
                </div>
            </button>
            <PostagemModal id={postagem.id} aberto={aberto} onFechar={() => setAberto(false)} />
        </>
    );
}