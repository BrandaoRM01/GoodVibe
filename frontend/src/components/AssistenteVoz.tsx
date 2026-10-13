import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Mic, Pause, Play, Square, Volume2, VolumeX, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAssistenteVoz } from "@/lib/voz/assistente-voz";
import { VEL_MAX, VEL_MIN } from "@/lib/voz/preferencias";

const BTN_PEQ =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const BTN_MODAL =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

// Páginas que usam o AppSidebar / MobileNav
const ROTAS_COM_SIDEBAR = /^\/(feed|messages|assistente|profile|admin)(\/|$)/;

// Posição personalizada do botão (segurar e arrastar)
const POS_KEY = "goodvib:voz-posicao";
const TAM = 48; // h-12 w-12
const MARGEM = 8;
const TEMPO_SEGURAR = 450;

type Pos = { right: number; bottom: number };

function limitar(p: Pos): Pos {
    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    return {
        right: Math.min(Math.max(p.right, MARGEM), Math.max(MARGEM, w - TAM - MARGEM)),
        bottom: Math.min(Math.max(p.bottom, MARGEM), Math.max(MARGEM, h - TAM - MARGEM)),
    };
}

function salvarPos(p: Pos | null) {
    try {
        if (p) localStorage.setItem(POS_KEY, JSON.stringify(p));
        else localStorage.removeItem(POS_KEY);
    } catch { }
}

export function AssistenteVoz() {
    const a = useAssistenteVoz();
    const [aberto, setAberto] = useState(false);
    const botaoRef = useRef<HTMLButtonElement>(null);
    const ativarRef = useRef<HTMLButtonElement>(null);
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    const [pos, setPos] = useState<Pos | null>(null);
    const [arrastando, setArrastando] = useState(false);
    const posRef = useRef<Pos | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const arrastouRef = useRef(false);
    const dragRef = useRef<{
        id: number;
        x: number;
        y: number;
        right: number;
        bottom: number;
        timer: number;
        ativo: boolean;
    } | null>(null);

    // carrega posição salva
    useEffect(() => {
        try {
            const raw = localStorage.getItem(POS_KEY);
            if (raw) {
                const p = limitar(JSON.parse(raw));
                posRef.current = p;
                setPos(p);
            }
        } catch { }
    }, []);

    // mantém dentro da tela ao redimensionar/girar
    useEffect(() => {
        const onResize = () => {
            if (!posRef.current) return;
            const p = limitar(posRef.current);
            posRef.current = p;
            setPos(p);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    function iniciarPressao(e: React.PointerEvent<HTMLButtonElement>) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const r = wrapRef.current!.getBoundingClientRect();
        const d = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            right: document.documentElement.clientWidth - r.right,
            bottom: window.innerHeight - r.bottom,
            ativo: false,
            timer: 0,
        };
        d.timer = window.setTimeout(() => {
            d.ativo = true;
            setArrastando(true);
            navigator.vibrate?.(30);
        }, TEMPO_SEGURAR);
        dragRef.current = d;
        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function moverPressao(e: React.PointerEvent<HTMLButtonElement>) {
        const d = dragRef.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.ativo) {
            // mexeu antes de completar o "segurar": não é arraste
            if (Math.hypot(dx, dy) > 10) {
                clearTimeout(d.timer);
                dragRef.current = null;
            }
            return;
        }
        const p = limitar({ right: d.right - dx, bottom: d.bottom - dy });
        posRef.current = p;
        setPos(p);
    }

    function soltarPressao() {
        const d = dragRef.current;
        if (!d) return;
        clearTimeout(d.timer);
        dragRef.current = null;
        if (d.ativo) {
            arrastouRef.current = true; // evita que o "soltar" conte como clique
            setTimeout(() => {
                arrastouRef.current = false;
            }, 0);
            setArrastando(false);
            salvarPos(posRef.current);
        }
    }

    // acessibilidade: Shift + setas move o botão por teclado
    function moverPorTeclado(e: React.KeyboardEvent<HTMLButtonElement>) {
        if (!e.shiftKey || !e.key.startsWith("Arrow")) return;
        e.preventDefault();
        const r = wrapRef.current!.getBoundingClientRect();
        const atual = posRef.current ?? {
            right: document.documentElement.clientWidth - r.right,
            bottom: window.innerHeight - r.bottom,
        };
        const passo = 24;
        const delta: Record<string, Partial<Pos>> = {
            ArrowLeft: { right: atual.right + passo },
            ArrowRight: { right: atual.right - passo },
            ArrowUp: { bottom: atual.bottom + passo },
            ArrowDown: { bottom: atual.bottom - passo },
        };
        const p = limitar({ ...atual, ...delta[e.key] });
        posRef.current = p;
        setPos(p);
        salvarPos(p);
    }

    function restaurarPosicao() {
        posRef.current = null;
        setPos(null);
        salvarPos(null);
    }

    if (!a.carregado) return null;

    const { prefs, fala, mic } = a;
    const ativo = prefs.ativo;
    const falando = fala.estado !== "parado";
    const ouvindo = mic === "ouvindo" || mic === "solicitando";
    const velTexto = prefs.velocidade.toFixed(1).replace(".", ",");

    const comSidebar = ROTAS_COM_SIDEBAR.test(pathname);
    const posicaoPadrao = comSidebar
        ? "z-40 right-4 bottom-[20dvh]"
        : "z-[100] right-4 bottom-[20dvh]";
    const zCustom = comSidebar ? "z-40" : "z-[100]";

    // onde abrir o painel, conforme a posição do botão
    const vw = typeof window !== "undefined" ? document.documentElement.clientWidth : 0;
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;
    const painelAbaixo = !!pos && pos.bottom > vh / 2;
    const painelEsquerda = !!pos && pos.right > vw / 2;

    return (
        <>
            {/* Pergunta da primeira visita (fechar com Esc/X equivale a "Agora não") */}
            <DialogPrimitive.Root open={!prefs.respondido} onOpenChange={(o) => !o && a.recusar()}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-[2147483000] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content
                        data-voz-ignorar
                        onOpenAutoFocus={(e) => {
                            e.preventDefault(); // foco direto em "Ativar": o leitor de tela anuncia e basta Enter
                            ativarRef.current?.focus();
                        }}
                        className="fixed left-1/2 top-1/2 z-[2147483001] grid max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                    >
                        <div className="space-y-1.5 text-center sm:text-left">
                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full gradient-primary text-primary-foreground shadow-glow sm:mx-0">
                                <Volume2 className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <DialogPrimitive.Title className="pt-2 text-xl font-semibold leading-none tracking-tight">
                                {"Assistente de voz"}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="text-base leading-relaxed text-foreground/80">
                                {"Olá! Deseja ativar o assistente de voz? Com ele, você poderá ouvir os textos e navegar pelo GoodVib& com mais facilidade."}
                            </DialogPrimitive.Description>
                            <p className="text-sm text-muted-foreground">
                                {"Pressione Enter para ativar, ou Esc para recusar. Se preferir, use “Responder por voz” e diga sim ou não."}
                            </p>
                        </div>

                        {a.respondendo && (
                            <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
                                <Mic className={`h-4 w-4 ${mic === "ouvindo" ? "animate-pulse" : ""}`} aria-hidden="true" />
                                {mic === "ouvindo" ? "Ouvindo sua resposta: diga “sim” ou “não”." : "Fazendo a pergunta..."}
                            </p>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                            <button ref={ativarRef} type="button" onClick={a.ativar} className={`${BTN_MODAL} gradient-primary text-primary-foreground shadow-glow`}>
                                Ativar assistente de voz
                            </button>
                            <button type="button" onClick={a.perguntarPorVoz} disabled={a.respondendo} className={`${BTN_MODAL} border border-border bg-background hover:bg-accent`}>
                                <Mic className="h-4 w-4" aria-hidden="true" />
                                Responder por voz
                            </button>
                            <button type="button" onClick={a.recusar} className={`${BTN_MODAL} border border-border bg-background hover:bg-accent`}>
                                Agora não
                            </button>
                        </div>

                        <DialogPrimitive.Close
                            aria-label="Fechar"
                            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </DialogPrimitive.Close>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            {/* Botão flutuante (segure para mover) */}
            <div
                data-voz-ignorar
                onKeyDown={(e) => {
                    if (e.key === "Escape" && aberto) {
                        setAberto(false);
                        botaoRef.current?.focus();
                    }
                }}
                style={pos ? { right: pos.right, bottom: pos.bottom } : undefined}
                className={`fixed flex flex-row-reverse items-center gap-2 ${pos ? zCustom : posicaoPadrao}`}
            >
                <div ref={wrapRef} className="relative">
                    {aberto && (
                        <div
                            id="painel-voz"
                            role="group"
                            aria-label="Controles do assistente de voz"
                            className={`absolute w-[min(18rem,calc(100vw-1.5rem))] max-h-[min(70dvh,calc(100dvh-9rem))] space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-soft ${painelAbaixo ? "top-full mt-2" : "bottom-full mb-2"
                                } ${painelEsquerda ? "left-0" : "right-0"}`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold">Assistente de voz</p>
                                    <p className="text-xs text-muted-foreground">{ativo ? "Ativado" : "Desativado"}</p>
                                </div>
                                <Switch checked={ativo} onCheckedChange={a.alternar} disabled={!a.falaSuportada} aria-label="Ativar ou desativar o assistente de voz" />
                            </div>

                            {!a.falaSuportada && <p className="text-xs text-destructive">Seu navegador não oferece leitura por voz.</p>}
                            {fala.erro && <p role="alert" className="text-xs text-destructive">{fala.erro}</p>}
                            {ativo && fala.semVozPt && !fala.erro && (
                                <p className="text-xs text-muted-foreground">Nenhuma voz em português encontrada. Usando a voz padrão do dispositivo.</p>
                            )}

                            {ativo && (
                                <>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" className={BTN_PEQ} disabled={!falando} onClick={fala.estado === "pausado" ? a.retomar : a.pausar}>
                                            {fala.estado === "pausado" ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
                                            {fala.estado === "pausado" ? "Retomar" : "Pausar"}
                                        </button>
                                        <button type="button" className={BTN_PEQ} disabled={!falando} onClick={a.parar}>
                                            <Square className="h-3.5 w-3.5" aria-hidden="true" />
                                            Parar leitura
                                        </button>
                                    </div>

                                    <div>
                                        <label htmlFor="voz-velocidade" className="text-xs font-medium">Velocidade da fala: {velTexto}x</label>
                                        <input
                                            id="voz-velocidade"
                                            type="range"
                                            min={VEL_MIN}
                                            max={VEL_MAX}
                                            step={0.1}
                                            value={prefs.velocidade}
                                            onChange={(e) => a.definirVelocidade(Number(e.target.value))}
                                            onPointerUp={a.amostra}
                                            onKeyUp={(e) => (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") && a.amostra()}
                                            className="mt-1 w-full accent-primary"
                                        />
                                    </div>
                                </>
                            )}

                            {(ativo || mic !== "inativo") && (
                                <div className="space-y-1.5 border-t border-border pt-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <label htmlFor="voz-comandos" className="text-sm font-medium">Comandos por voz</label>
                                        <Switch id="voz-comandos" checked={ouvindo} onCheckedChange={a.alternarComandos} disabled={mic === "sem-suporte"} />
                                    </div>
                                    {mic === "sem-suporte" ? (
                                        <p className="text-xs text-muted-foreground">Seu navegador não oferece reconhecimento de voz.</p>
                                    ) : ouvindo ? (
                                        <p className="text-xs font-medium text-destructive">
                                            <Mic className="mr-1 inline h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                                            {"Microfone ouvindo. Diga: “ir para mensagens”, “ir para o perfil”, “ir para o início”, “ir para o assistente de IA”, “fazer login”, “criar conta”, “esqueci minha senha”, “página inicial”, “parar leitura”, “repetir leitura” ou “desativar assistente de voz”."}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            {"Ao ativar, o navegador pedirá permissão do microfone. Em alguns navegadores o áudio é processado por um serviço online do fabricante. O GoodVib& não grava nem salva o que você diz."}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="border-t border-border pt-3">
                                <button type="button" className={BTN_PEQ} onClick={restaurarPosicao} disabled={!pos}>
                                    Restaurar posição do botão
                                </button>
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    Segure o botão e arraste para mudá-lo de lugar. Pelo teclado: Shift + setas.
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        ref={botaoRef}
                        type="button"
                        onClick={() => {
                            if (arrastouRef.current) return;
                            setAberto((v) => !v);
                        }}
                        onPointerDown={iniciarPressao}
                        onPointerMove={moverPressao}
                        onPointerUp={soltarPressao}
                        onPointerCancel={soltarPressao}
                        onContextMenu={(e) => e.preventDefault()}
                        onKeyDown={moverPorTeclado}
                        style={{ touchAction: "none" }}
                        aria-expanded={aberto}
                        aria-controls={aberto ? "painel-voz" : undefined}
                        aria-label={`Assistente de voz ${ativo ? "ativado" : "desativado"}. ${aberto ? "Fechar" : "Abrir"} controles de acessibilidade`}
                        title={`Assistente de voz: ${ativo ? "ativado" : "desativado"}. Segure e arraste para mover`}
                        className={`relative grid h-12 w-12 select-none place-items-center rounded-full border shadow-glow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${arrastando ? "scale-110 cursor-grabbing ring-4 ring-primary/40" : ""
                            } ${ativo ? "gradient-primary border-transparent text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent"}`}
                    >
                        {ativo ? <Volume2 className="h-5 w-5" aria-hidden="true" /> : <VolumeX className="h-5 w-5" aria-hidden="true" />}
                        {falando && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
                        {ouvindo && <span aria-hidden="true" className="absolute right-0.5 top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-card bg-destructive" />}
                    </button>
                </div>

                {falando && (
                    <button type="button" onClick={a.parar} aria-label="Parar leitura" title="Parar leitura (Esc)" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card shadow-soft hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Square className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>

            <div role="status" aria-live="polite" className="sr-only">{a.aviso}</div>
        </>
    );
}