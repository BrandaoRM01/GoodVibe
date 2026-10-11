import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, Hash, Mic, RotateCcw, Send, Sparkles, Square } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RotaProtegida } from "@/components/RotaProtegida";
import { BotaoSeguir } from "@/components/BotaoSeguir";
import { AvatarUsuario, PerfilUsuarioLink } from "@/components/UsuarioAdminUI";
import { ApiError } from "@/lib/api";
import {
    apiEnviarMensagemAssistente,
    MAX_HISTORICO,
    MAX_MENSAGEM,
    type MensagemHistorico,
    type PerfilRecomendadoAPI,
} from "@/lib/assistente";
import {
    carregarConversa,
    limparConversaAssistente,
    salvarConversa,
    type MensagemChat,
} from "@/lib/conversaAssistente";

export const Route = createFileRoute("/assistente")({
    head: () => ({ meta: [{ title: "Assistente de IA — GoodVib&" }] }),
    component: AssistentePage,
});

function AssistentePage() {
    return (
        <RotaProtegida>
            <AssistenteConteudo />
        </RotaProtegida>
    );
}

const MSG_CONEXAO = "Ops! Não consegui me conectar agora. 💙 Verifique sua internet e tente novamente.";
const MSG_DEMORA = "Ops! Demorei mais do que o esperado para responder. 💙 Tente novamente em instantes.";
const MSG_GENERICA = "Ops! Nosso assistente está indisponível no momento. 💙 Tente novamente daqui a pouquinho.";
const MSG_PADRAO_API = "Erro inesperado na requisição.";

const PLACEHOLDER_PADRAO = "Escreva sua mensagem... (Shift+Enter para quebrar linha)";
const PLACEHOLDER_OUVINDO = "Ouvindo... fale agora 🎤";

const SUGESTOES = [
    "Estou passando por dificuldades com moradia e gostaria de encontrar pessoas que falem sobre isso.",
    "Quero conhecer perfis que compartilham ações de voluntariado.",
    "Pode me ajudar a organizar meus pensamentos sobre um problema?",
];

type ReconhecimentoVoz = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: any) => void) | null;
    onerror: ((e: any) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

function criarReconhecimento(): ReconhecimentoVoz | null {
    if (typeof window === "undefined") return null;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return null;
    const r: ReconhecimentoVoz = new Ctor();
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = true;
    return r;
}

function mensagemErroVoz(codigo?: string): string | null {
    switch (codigo) {
        case "not-allowed":
        case "service-not-allowed":
            return "Não consegui acessar o microfone. Permita o uso do microfone para este site nas configurações do navegador (ícone de cadeado ao lado do endereço) e tente de novo.";
        case "no-speech":
            return "Não ouvi nada. Clique no microfone e tente falar de novo.";
        case "audio-capture":
            return "Nenhum microfone foi encontrado neste dispositivo.";
        case "network":
            return "Falha de conexão com o serviço de voz do navegador. Verifique sua internet.";
        case "aborted":
            return null;
        default:
            return "Não consegui usar o microfone agora. Tente novamente.";
    }
}

function mensagemDeErro(err: unknown): string {
    if (err instanceof ApiError) return err.message && err.message !== MSG_PADRAO_API ? err.message : MSG_GENERICA;
    if (err instanceof DOMException && err.name === "AbortError") return MSG_DEMORA;
    return MSG_CONEXAO;
}

function AssistenteConteudo() {
    const queryClient = useQueryClient();
    const [mensagens, setMensagens] = useState<MensagemChat[]>(() => carregarConversa());
    const [texto, setTexto] = useState("");
    const [ouvindo, setOuvindo] = useState(false);
    const [erroVoz, setErroVoz] = useState("");

    const proximoId = useRef(mensagens.reduce((maior, m) => Math.max(maior, m.id), 0) + 1);
    const areaRef = useRef<HTMLDivElement>(null);
    const campoRef = useRef<HTMLTextAreaElement>(null);
    const pertoDoFim = useRef(true);
    const forcarRolagem = useRef(false);
    const reconhecimentoRef = useRef<ReconhecimentoVoz | null>(null);
    const baseDitadoRef = useRef("");

    const envio = useMutation({
        mutationFn: ({ mensagem, historico }: { mensagem: string; historico: MensagemHistorico[] }) =>
            apiEnviarMensagemAssistente(mensagem, historico),
    });
    const aguardando = envio.isPending;

    useEffect(() => {
        const area = areaRef.current;
        if (!area) return;
        if (forcarRolagem.current || pertoDoFim.current) {
            area.scrollTo({ top: area.scrollHeight, behavior: "smooth" });
        }
        forcarRolagem.current = false;
    }, [mensagens, aguardando]);

    useEffect(() => {
        const campo = campoRef.current;
        if (!campo) return;
        campo.style.height = "auto";
        campo.style.height = `${Math.min(campo.scrollHeight, 140)}px`;
    }, [texto]);

    useEffect(() => {
        salvarConversa(mensagens);
    }, [mensagens]);

    useEffect(() => {
        return () => pararVoz();
    }, []);

    function aoRolar() {
        const area = areaRef.current;
        if (!area) return;
        pertoDoFim.current = area.scrollHeight - area.scrollTop - area.clientHeight < 120;
    }

    function pararVoz() {
        const r = reconhecimentoRef.current;
        if (r) {
            r.onresult = null;
            r.onerror = null;
            r.onend = null;
            try {
                r.stop();
            } catch {
                /* já parado */
            }
            reconhecimentoRef.current = null;
        }
        setOuvindo(false);
    }

    function alternarVoz() {
        if (ouvindo) {
            pararVoz();
            return;
        }
        setErroVoz("");

        if (typeof window !== "undefined" && !window.isSecureContext) {
            setErroVoz("O microfone só funciona em conexão segura (HTTPS) ou em localhost.");
            return;
        }

        const r = criarReconhecimento();
        if (!r) {
            setErroVoz("Este navegador não suporta ditado por voz. Tente usar o Chrome, Edge ou Safari.");
            return;
        }

        baseDitadoRef.current = texto.trim() ? `${texto.trim()} ` : "";

        r.onresult = (e: any) => {
            let falado = "";
            for (let i = 0; i < e.results.length; i++) {
                falado += e.results[i][0].transcript;
            }
            setTexto((baseDitadoRef.current + falado).slice(0, MAX_MENSAGEM));
        };
        r.onerror = (e: any) => {
            const aviso = mensagemErroVoz(e?.error);
            if (aviso) setErroVoz(aviso);
            pararVoz();
        };
        r.onend = () => pararVoz();

        reconhecimentoRef.current = r;
        try {
            r.start();
            setOuvindo(true);
            campoRef.current?.focus();
        } catch {
            setErroVoz(mensagemErroVoz() ?? "");
            pararVoz();
        }
    }

    function enviar() {
        const conteudo = texto.trim();
        if (!conteudo || conteudo.length > MAX_MENSAGEM || aguardando) return;

        pararVoz();
        setErroVoz("");

        const validas = mensagens.filter((m) => !m.erro && !m.falhou);
        const historico: MensagemHistorico[] = validas
            .slice(-MAX_HISTORICO)
            .map(({ papel, texto: t }) => ({ papel, texto: t }));

        const idUsuario = proximoId.current++;
        forcarRolagem.current = true;
        setMensagens([...validas, { id: idUsuario, papel: "usuario", texto: conteudo }]);

        envio.mutate(
            { mensagem: conteudo, historico },
            {
                onSuccess: (data) => {
                    setTexto("");
                    setMensagens((prev) => [
                        ...prev,
                        { id: proximoId.current++, papel: "assistente", texto: data.mensagem.texto, perfis: data.perfis },
                    ]);
                },
                onError: (err) => {
                    setMensagens((prev) => [
                        ...prev.map((m) => (m.id === idUsuario ? { ...m, falhou: true } : m)),
                        { id: proximoId.current++, papel: "assistente", texto: mensagemDeErro(err), erro: true },
                    ]);
                    if (err instanceof ApiError && err.status === 401) {
                        queryClient.invalidateQueries({ queryKey: ["usuario-atual"] });
                    }
                },
            }
        );
    }

    function usarSugestao(sugestao: string) {
        setTexto(sugestao);
        campoRef.current?.focus();
    }

    function reiniciarConversa() {
        if (aguardando) return;
        pararVoz();
        setErroVoz("");
        setTexto("");
        setMensagens([]);
        proximoId.current = 1;
        limparConversaAssistente();
    }

    const podeEnviar = texto.trim().length > 0 && !aguardando;

    return (
        <div className="min-h-screen flex">
            <AppSidebar />
            <main className="flex-1 min-w-0 flex flex-col h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
                <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border glass">
                    <div className="h-11 w-11 rounded-2xl gradient-primary grid place-items-center shadow-glow shrink-0">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold tracking-tight leading-tight">Assistente de IA</h1>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            Converse, tire dúvidas e descubra perfis da comunidade com assuntos parecidos com o seu.
                        </p>
                    </div>
                    {mensagens.length > 0 && (
                        <button
                            type="button"
                            onClick={reiniciarConversa}
                            disabled={aguardando}
                            aria-label="Reiniciar conversa"
                            title="Reiniciar conversa"
                            className="group h-9 w-9 shrink-0 rounded-full grid place-items-center bg-accent text-foreground hover:bg-accent/70 transition disabled:opacity-50"
                        >
                            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-180" />
                        </button>
                    )}
                    <ThemeToggle />
                </header>

                <div
                    ref={areaRef}
                    onScroll={aoRolar}
                    role="log"
                    aria-live="polite"
                    className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-6"
                >
                    <div className="mx-auto w-full max-w-2xl space-y-4">
                        {mensagens.length === 0 && !aguardando && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center text-center gap-3 py-10"
                            >
                                <div className="h-16 w-16 rounded-3xl gradient-primary grid place-items-center shadow-glow">
                                    <Sparkles className="h-7 w-7 text-primary-foreground" />
                                </div>
                                <h2 className="text-lg font-bold tracking-tight">Oi! Eu sou o assistente do GoodVib& 💙</h2>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    Pode conversar comigo, compartilhar uma dúvida ou me contar o que você está buscando. Quando fizer
                                    sentido, eu te mostro perfis da comunidade que falam sobre o assunto.
                                </p>
                                <div className="flex flex-col gap-2 w-full max-w-md pt-2">
                                    {SUGESTOES.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => usarSugestao(s)}
                                            className="text-left text-xs sm:text-sm bg-card border border-border hover:bg-accent hover:border-primary/40 rounded-2xl px-4 py-2.5 transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {mensagens.map((m) => (
                            <BolhaMensagem key={m.id} mensagem={m} />
                        ))}

                        {aguardando && <IndicadorDigitando />}
                    </div>
                </div>

                <div className="border-t border-border px-4 sm:px-6 py-3">
                    <div className="mx-auto w-full max-w-2xl">
                        <div className="flex items-end gap-2 bg-card border border-border rounded-3xl pl-4 pr-2 py-2 focus-within:ring-2 focus-within:ring-primary/40 transition">
                            <textarea
                                ref={campoRef}
                                rows={1}
                                value={texto}
                                readOnly={aguardando}
                                maxLength={MAX_MENSAGEM}
                                onChange={(e) => setTexto(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        enviar();
                                    }
                                }}
                                aria-label="Mensagem para o assistente"
                                placeholder={ouvindo ? PLACEHOLDER_OUVINDO : PLACEHOLDER_PADRAO}
                                className="flex-1 bg-transparent outline-none resize-none text-sm py-2 max-h-[140px] scrollbar-thin"
                            />
                            <button
                                type="button"
                                onClick={alternarVoz}
                                disabled={aguardando}
                                aria-label={ouvindo ? "Parar de ouvir" : "Falar mensagem"}
                                aria-pressed={ouvindo}
                                title={ouvindo ? "Parar de ouvir" : "Falar mensagem"}
                                className={`h-9 w-9 shrink-0 rounded-full grid place-items-center transition disabled:opacity-50 ${ouvindo
                                    ? "bg-destructive text-destructive-foreground animate-pulse"
                                    : "bg-accent text-foreground hover:bg-accent/70"
                                    }`}
                            >
                                {ouvindo ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={enviar}
                                disabled={!podeEnviar}
                                aria-label="Enviar mensagem"
                                className="h-9 w-9 shrink-0 rounded-full gradient-primary grid place-items-center text-primary-foreground hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        {erroVoz && (
                            <p role="alert" className="text-[11px] text-destructive mt-1 pl-2">
                                {erroVoz}
                            </p>
                        )}
                        {texto.length > MAX_MENSAGEM * 0.8 && (
                            <p className="text-[10px] text-muted-foreground text-right mt-1 pr-2">
                                {texto.length}/{MAX_MENSAGEM}
                            </p>
                        )}
                    </div>
                </div>
            </main>
            <MobileNav />
        </div>
    );
}

function AvatarAssistente() {
    return (
        <div className="h-8 w-8 rounded-full gradient-primary grid place-items-center shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
    );
}

function BolhaMensagem({ mensagem }: { mensagem: MensagemChat }) {
    if (mensagem.papel === "usuario") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-end gap-1"
            >
                <div
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-3xl rounded-br-md text-sm gradient-primary text-primary-foreground shadow-soft whitespace-pre-wrap break-words ${mensagem.falhou ? "opacity-70" : ""
                        }`}
                >
                    {mensagem.texto}
                </div>
                {mensagem.falhou && (
                    <span className="text-[10px] text-muted-foreground pr-1">Não enviada — sua mensagem continua no campo.</span>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2"
        >
            <AvatarAssistente />
            <div className="flex flex-col items-start gap-2 min-w-0 max-w-[88%] sm:max-w-[80%]">
                <div
                    className={`px-4 py-2.5 rounded-3xl rounded-bl-md text-sm whitespace-pre-wrap break-words border ${mensagem.erro ? "bg-destructive/5 border-destructive/30" : "bg-card border-border"
                        }`}
                >
                    {mensagem.texto}
                </div>
                {mensagem.perfis && mensagem.perfis.length > 0 && (
                    <div className="w-full space-y-2">
                        {mensagem.perfis.map((p) => (
                            <CartaoPerfil key={p.email} perfil={p} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function CartaoPerfil({ perfil }: { perfil: PerfilRecomendadoAPI }) {
    return (
        <div className="w-full bg-card border border-border rounded-3xl p-3.5 flex gap-3 shadow-soft">
            <PerfilUsuarioLink email={perfil.email} className="shrink-0 hover:opacity-80 transition-opacity">
                <AvatarUsuario url={perfil.url_foto} nome={perfil.username} className="h-12 w-12" />
            </PerfilUsuarioLink>
            <div className="flex-1 min-w-0 space-y-2">
                <PerfilUsuarioLink email={perfil.email} className="block group">
                    <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                        {perfil.username}
                    </p>
                </PerfilUsuarioLink>

                {perfil.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Publica sobre</span>
                        {perfil.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                            >
                                <Hash className="h-3 w-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {perfil.trecho && (
                    <p className="text-xs text-muted-foreground italic line-clamp-2 break-words">“{perfil.trecho}”</p>
                )}

                <div className="flex items-center gap-2 pt-0.5">
                    <PerfilUsuarioLink
                        email={perfil.email}
                        className="inline-flex items-center rounded-full gradient-primary text-primary-foreground text-xs font-semibold px-3.5 py-1.5 hover:scale-105 transition-transform"
                    >
                        Ver perfil
                    </PerfilUsuarioLink>
                    <BotaoSeguir email={perfil.email} />
                </div>
            </div>
        </div>
    );
}

function IndicadorDigitando() {
    return (
        <div className="flex items-start gap-2" aria-label="O assistente está escrevendo">
            <AvatarAssistente />
            <div className="bg-card border border-border rounded-3xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    );
}