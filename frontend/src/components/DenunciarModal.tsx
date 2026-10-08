import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { useCriarDenuncia } from "@/lib/use-denuncias";
import { MAX_CARACTERES_DENUNCIA, MOTIVOS_DENUNCIA, type TipoDenuncia } from "@/lib/denuncias";

export function DenunciarModal({
    aberto,
    onFechar,
    tipo,
    alvoId,
}: {
    aberto: boolean;
    onFechar: () => void;
    tipo: TipoDenuncia;
    alvoId: number;
}) {
    const [motivo, setMotivo] = useState("");
    const [descricao, setDescricao] = useState("");
    const criarDenuncia = useCriarDenuncia();

    useEffect(() => {
        if (!aberto) {
            setMotivo("");
            setDescricao("");
        }
    }, [aberto]);

    const outro = motivo === "outro";
    const podeEnviar = !!motivo && (!outro || !!descricao.trim()) && !criarDenuncia.isPending;
    const alvoTexto = tipo === "postagem" ? "postagem" : "comentário";

    function enviar() {
        if (!podeEnviar) return;

        criarDenuncia.mutate(
            { tipo, id: alvoId, motivo, descricao: outro ? descricao.trim() : undefined },
            {
                onSuccess: (data) => {
                    toast.success(data.mensagem);
                    onFechar();
                },
                onError: (err) => {
                    toast.error(err instanceof ApiError ? err.message : "Não foi possível enviar a denúncia.");
                },
            }
        );
    }

    return (
        <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
            <DialogContent className="w-[calc(100%-1.5rem)] max-w-md gap-0 p-0 overflow-hidden rounded-3xl bg-card border-border">
                <div className="px-5 py-4 border-b border-border text-center">
                    <DialogTitle className="text-base inline-flex items-center gap-2">
                        <Flag className="h-4 w-4 text-primary" /> Denunciar {alvoTexto}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Escolha o motivo da denúncia para que a equipe de moderação analise o conteúdo
                    </DialogDescription>
                </div>

                <div className="px-5 py-4 space-y-3">
                    <label className="block text-xs font-semibold text-muted-foreground">
                        Qual o motivo da denúncia?
                    </label>
                    <select
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        className="w-full bg-background border border-border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option value="" disabled>
                            Selecione um motivo...
                        </option>
                        {MOTIVOS_DENUNCIA.map((m) => (
                            <option key={m.valor} value={m.valor}>
                                {m.rotulo}
                            </option>
                        ))}
                    </select>

                    {outro && (
                        <div>
                            <textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                maxLength={MAX_CARACTERES_DENUNCIA}
                                rows={3}
                                autoFocus
                                placeholder="Descreva o motivo da denúncia..."
                                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            <p className="text-right text-[10px] text-muted-foreground">
                                {descricao.length}/{MAX_CARACTERES_DENUNCIA}
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onFechar}
                        disabled={criarDenuncia.isPending}
                        className="text-xs font-medium px-4 py-2 rounded-full hover:bg-accent transition-colors disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={enviar}
                        disabled={!podeEnviar}
                        className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full shadow-soft hover:shadow-glow transition-all disabled:opacity-50"
                    >
                        {criarDenuncia.isPending ? "Enviando..." : "Denunciar"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}