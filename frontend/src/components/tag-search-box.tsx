import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSugestoesTags } from "@/lib/use-postagens";

export function TagSearchBox({
    tagsAtuais,
    onAdicionar,
    disabled,
    onFechar,
}: {
    tagsAtuais: string[];
    onAdicionar: (nome: string) => void;
    disabled?: boolean;
    onFechar: () => void;
}) {
    const [termo, setTermo] = useState("");
    const [termoDebounced, setTermoDebounced] = useState("");
    const [aberto, setAberto] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTermoDebounced(termo), 250);
        return () => clearTimeout(timer);
    }, [termo]);

    const { data: sugestoes, isFetching } = useSugestoesTags(termoDebounced);
    const sugestoesFiltradas = (sugestoes ?? []).filter(
        (s) => !tagsAtuais.some((t) => t.toLowerCase() === s.nome.toLowerCase())
    );

    function escolher(nome: string) {
        onAdicionar(nome);
        setTermo("");
        setAberto(false);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (sugestoesFiltradas.length > 0) {
                escolher(sugestoesFiltradas[0].nome);
            } else if (termo.trim()) {
                escolher(termo);
            }
        } else if (e.key === "Escape") {
            onFechar();
        }
    }

    return (
        <div className="mt-2 relative">
            <div className="flex items-center gap-2">
                <input
                    value={termo}
                    onChange={(e) => {
                        setTermo(e.target.value);
                        setAberto(true);
                    }}
                    onFocus={() => setAberto(true)}
                    onBlur={() => setTimeout(() => setAberto(false), 150)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="Ex: voluntariado, doação..."
                    autoFocus
                    className="flex-1 text-sm bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 outline-none placeholder:text-muted-foreground"
                />
                <button
                    type="button"
                    onClick={onFechar}
                    className="h-7 w-7 rounded-full grid place-items-center hover:bg-accent shrink-0"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {aberto && termo.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-xl shadow-soft overflow-hidden">
                    {isFetching && <p className="px-3 py-2 text-xs text-muted-foreground">Buscando...</p>}

                    {!isFetching && sugestoesFiltradas.length > 0 && (
                        <ul>
                            {sugestoesFiltradas.map((s) => (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => escolher(s.nome)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                    >
                                        #{s.nome}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!isFetching && sugestoesFiltradas.length === 0 && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => escolher(termo)}
                            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                        >
                            Criar tag "#{termo.trim()}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}