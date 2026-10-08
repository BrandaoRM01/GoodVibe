import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Flag, Trash2 } from "lucide-react";
import { API_URL, ApiError } from "@/lib/api";
import { AvatarUsuario, PerfilUsuarioLink } from "@/components/UsuarioAdminUI";
import { formatarTempoComentario } from "@/lib/comentarios";
import { useAprovarDenuncia, useRejeitarDenuncia } from "@/lib/use-denuncias";
import type { DenunciaAPI } from "@/lib/denuncias";

function mensagemErro(err: unknown, padrao: string) {
    return err instanceof ApiError ? err.message : padrao;
}

export function ItemDenuncia({
    d,
    onNavegar,
    expansivel = false,
}: {
    d: DenunciaAPI;
    onNavegar?: () => void;
    expansivel?: boolean;
}) {
    const aprovar = useAprovarDenuncia();
    const rejeitar = useRejeitarDenuncia();
    const [aberto, setAberto] = useState(false);
    const ocupado = aprovar.isPending || rejeitar.isPending;
    const ehPostagem = d.tipo === "postagem";

    function handleAprovar() {
        const aviso = ehPostagem
            ? "Aprovar esta denúncia vai excluir a postagem denunciada. Continuar?"
            : "Aprovar esta denúncia vai excluir o comentário denunciado (e as respostas dele). Continuar?";
        if (!window.confirm(aviso)) return;

        aprovar.mutate(d.id, {
            onSuccess: (data) => toast.success(data.mensagem),
            onError: (err) => toast.error(mensagemErro(err, "Não foi possível aprovar a denúncia.")),
        });
    }

    function handleRejeitar() {
        if (!window.confirm("Rejeitar esta denúncia? O conteúdo será mantido.")) return;

        rejeitar.mutate(d.id, {
            onSuccess: (data) => toast.success(data.mensagem),
            onError: (err) => toast.error(mensagemErro(err, "Não foi possível rejeitar a denúncia.")),
        });
    }

    return (
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40">
            <Flag className="h-4 w-4 text-primary mt-1 shrink-0" />

            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <PerfilUsuarioLink email={d.denunciante.email} onClick={onNavegar} className="shrink-0">
                        <AvatarUsuario url={d.denunciante.urlFoto} nome={d.denunciante.username} className="h-6 w-6" />
                    </PerfilUsuarioLink>
                    <PerfilUsuarioLink
                        email={d.denunciante.email}
                        onClick={onNavegar}
                        className="text-sm font-semibold hover:underline"
                    >
                        {d.denunciante.username}
                    </PerfilUsuarioLink>
                    <span className="text-[10px] text-muted-foreground">
                        denunciou {ehPostagem ? "uma postagem" : "um comentário"} · {formatarTempoComentario(d.time)}
                    </span>
                </div>

                <div>
                    <p className="text-xs font-semibold">{d.motivoRotulo}</p>
                    {d.descricao && (
                        <p
                            className={`text-xs text-muted-foreground mt-0.5 break-words whitespace-pre-wrap ${aberto ? "" : "line-clamp-2"
                                }`}
                        >
                            “{d.descricao}”
                        </p>
                    )}
                </div>

                {expansivel && (
                    <>
                        <button
                            type="button"
                            onClick={() => setAberto((v) => !v)}
                            aria-expanded={aberto}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            {aberto ? "Ocultar" : "Ver"} {ehPostagem ? "postagem" : "comentário"}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`} />
                        </button>

                        {aberto && (
                            <div className="rounded-xl border border-border bg-card p-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                    {ehPostagem ? "Postagem" : "Comentário"} de{" "}
                                    {d.alvo.autorEmail ? (
                                        <PerfilUsuarioLink
                                            email={d.alvo.autorEmail}
                                            onClick={onNavegar}
                                            className="normal-case hover:underline"
                                        >
                                            {d.alvo.autorUsername}
                                        </PerfilUsuarioLink>
                                    ) : (
                                        d.alvo.autorUsername
                                    )}
                                </p>
                                <p className="text-sm break-words whitespace-pre-wrap">{d.alvo.conteudo}</p>
                                {d.alvo.imagem && (
                                    <img
                                        src={`${API_URL}/${d.alvo.imagem}`}
                                        alt=""
                                        className="mt-2 h-24 rounded-lg object-cover border border-border"
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-col gap-1 shrink-0">
                <button
                    type="button"
                    onClick={handleAprovar}
                    disabled={ocupado}
                    title="Aprovar denúncia (exclui o conteúdo)"
                    aria-label="Aprovar denúncia"
                    className="h-7 w-7 rounded-full bg-success/15 text-success grid place-items-center hover:bg-success/25 disabled:opacity-50"
                >
                    <Check className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={handleRejeitar}
                    disabled={ocupado}
                    title="Rejeitar denúncia (mantém o conteúdo)"
                    aria-label="Rejeitar denúncia"
                    className="h-7 w-7 rounded-full bg-destructive/15 text-destructive grid place-items-center hover:bg-destructive/25 disabled:opacity-50"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}