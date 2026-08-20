import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, LocateFixed, ImageUp } from "lucide-react";
import { useEditarPerfil } from "@/lib/use-auth";
import { API_URL, type Usuario } from "@/lib/api";

type Props = {
    usuario: Usuario;
    aberto: boolean;
    onClose: () => void;
};

export function EditProfile({ usuario, aberto, onClose }: Props) {
    const editarPerfil = useEditarPerfil();

    const [username, setUsername] = useState(usuario.username);
    const [descricaoPerfil, setDescricaoPerfil] = useState(usuario.descricao_perfil ?? "");
    const [localizacao, setLocalizacao] = useState(usuario.localizacao ?? "");
    const [foto, setFoto] = useState<File | null>(null);
    const [capa, setCapa] = useState<File | null>(null);
    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const [previewCapa, setPreviewCapa] = useState<string | null>(null);
    const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
    const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    const fotoInputRef = useRef<HTMLInputElement>(null);
    const capaInputRef = useRef<HTMLInputElement>(null);

    if (!aberto) return null;

    function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const arquivo = e.target.files?.[0];
        if (!arquivo) return;
        setFoto(arquivo);
        setPreviewFoto(URL.createObjectURL(arquivo));
    }

    function handleCapaChange(e: React.ChangeEvent<HTMLInputElement>) {
        const arquivo = e.target.files?.[0];
        if (!arquivo) return;
        setCapa(arquivo);
        setPreviewCapa(URL.createObjectURL(arquivo));
    }

    function usarLocalizacaoAtual() {
        if (!navigator.geolocation) {
            setErroLocalizacao("Seu navegador não suporta geolocalização.");
            return;
        }

        setBuscandoLocalizacao(true);
        setErroLocalizacao(null);

        navigator.geolocation.getCurrentPosition(
            async (posicao) => {
                try {
                    const { latitude, longitude } = posicao.coords;
                    const resp = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                        { headers: { "Accept-Language": "pt-BR" } }
                    );
                    const data = await resp.json();
                    const endereco = data.address ?? {};
                    const cidade = endereco.city ?? endereco.town ?? endereco.village ?? endereco.municipality ?? "";
                    const estado = endereco.state_code?.toUpperCase() ?? endereco.state ?? "";

                    const localizacaoFormatada = [cidade, estado].filter(Boolean).join(", ");
                    setLocalizacao(localizacaoFormatada || "Localização não identificada");
                } catch {
                    setErroLocalizacao("Não foi possível identificar sua localização. Preencha manualmente.");
                } finally {
                    setBuscandoLocalizacao(false);
                }
            },
            () => {
                setErroLocalizacao("Permissão de localização negada. Preencha manualmente.");
                setBuscandoLocalizacao(false);
            }
        );
    }

    async function handleSalvar() {
        setErro(null);

        if (!username.trim()) {
            setErro("O nome de usuário é obrigatório.");
            return;
        }

        try {
            await editarPerfil.mutateAsync({
                username: username.trim(),
                descricaoPerfil,
                localizacao,
                foto,
                capa,
            });
            onClose();
        } catch (e: any) {
            setErro(e?.message ?? "Não foi possível salvar as alterações.");
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border border-border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-glow"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Capa com preview */}
                    <div className="relative h-32 sm:h-40 rounded-t-3xl overflow-hidden gradient-primary">
                        {(previewCapa ?? (usuario.url_capa ? `${API_URL}/${usuario.url_capa}` : null)) ? (
                            <img
                                src={previewCapa ?? `${API_URL}/${usuario.url_capa}`}
                                alt="Capa"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
                        )}

                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => capaInputRef.current?.click()}
                            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                        >
                            <ImageUp className="h-3.5 w-3.5" /> Trocar capa
                        </button>
                        <input ref={capaInputRef} type="file" accept="image/*" className="hidden" onChange={handleCapaChange} />
                    </div>

                    {/* Foto de perfil sobreposta */}
                    <div className="px-6 -mt-10">
                        <div className="relative h-20 w-20 rounded-full border-4 border-card overflow-hidden gradient-primary grid place-items-center">
                            {(previewFoto ?? (usuario.url_foto ? `${API_URL}/${usuario.url_foto}` : null)) ? (
                                <img
                                    src={previewFoto ?? `${API_URL}/${usuario.url_foto}`}
                                    alt={usuario.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-primary-foreground text-2xl font-bold">
                                    {usuario.username?.[0]?.toUpperCase()}
                                </span>
                            )}
                            <button
                                onClick={() => fotoInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity grid place-items-center"
                            >
                                <ImageUp className="h-5 w-5 text-white" />
                            </button>
                            <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                        </div>
                    </div>

                    {/* Formulário */}
                    <div className="p-6 pt-4 space-y-4">
                        <h2 className="text-lg font-bold">Editar perfil</h2>

                        <div>
                            <label className="text-sm font-semibold mb-1 block">Nome de usuário</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold mb-1 block">Bio</label>
                            <textarea
                                value={descricaoPerfil}
                                onChange={(e) => setDescricaoPerfil(e.target.value)}
                                rows={3}
                                maxLength={500}
                                placeholder="Conte um pouco sobre você..."
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-right">{descricaoPerfil.length}/500</p>
                        </div>

                        <div>
                            <label className="text-sm font-semibold mb-1 block">Localização</label>
                            <div className="flex gap-2">
                                <input
                                    value={localizacao}
                                    onChange={(e) => setLocalizacao(e.target.value)}
                                    placeholder="Ex: São Paulo, SP"
                                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                    maxLength={150}
                                />
                                <button
                                    type="button"
                                    onClick={usarLocalizacaoAtual}
                                    disabled={buscandoLocalizacao}
                                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60"
                                    title="Usar minha localização atual"
                                >
                                    {buscandoLocalizacao ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LocateFixed className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {erroLocalizacao && <p className="text-xs text-destructive mt-1">{erroLocalizacao}</p>}
                        </div>

                        {erro && (
                            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">{erro}</p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-full border border-border py-2.5 font-semibold text-sm hover:bg-accent transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSalvar}
                                disabled={editarPerfil.isPending}
                                className="flex-1 rounded-full bg-primary text-primary-foreground py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2"
                            >
                                {editarPerfil.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}