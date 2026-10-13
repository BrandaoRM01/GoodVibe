import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { PREFS_PADRAO, lerPrefs, salvarPrefs, type PrefsVoz } from "./preferencias";
import * as sintese from "./fala";
import { textoParaLer } from "./extrair-texto";
import {
    criarReconhecedor,
    reconhecimentoSuportado,
    type Comando,
    type Destino,
    type ErroReconhecimento,
    type ModoReconhecimento,
    type Reconhecedor,
} from "./reconhecimento";

export type EstadoMic = "inativo" | "solicitando" | "ouvindo" | "erro" | "sem-suporte";

interface AssistenteCtx {
    carregado: boolean;
    prefs: PrefsVoz;
    fala: sintese.SnapFala;
    falaSuportada: boolean;
    mic: EstadoMic;
    aviso: string;
    respondendo: boolean;
    ativar: () => void;
    desativar: () => void;
    recusar: () => void;
    alternar: () => void;
    definirVelocidade: (v: number) => void;
    amostra: () => void;
    pausar: () => void;
    retomar: () => void;
    parar: () => void;
    alternarComandos: () => void;
    perguntarPorVoz: () => void;
}

const Ctx = createContext<AssistenteCtx | null>(null);

export function useAssistenteVoz() {
    const c = useContext(Ctx);
    if (!c) throw new Error("useAssistenteVoz deve ser usado dentro de AssistenteVozProvider");
    return c;
}

const ERROS_MIC: Record<ErroReconhecimento, string> = {
    permissao: "Permissão do microfone negada. Os comandos por voz foram desativados.",
    microfone: "Nenhum microfone disponível. Os comandos por voz foram desativados.",
    rede: "O reconhecimento de voz não está disponível agora. Os comandos por voz foram desativados.",
};

const DESTINOS: Record<
    Destino,
    { to: "/" | "/feed" | "/messages" | "/assistente" | "/profile" | "/admin" | "/login" | "/signup" | "/esqueci-senha"; nome: string }
> = {
    feed: { to: "/feed", nome: "Início" },
    mensagens: { to: "/messages", nome: "Mensagens" },
    assistente: { to: "/assistente", nome: "Assistente de IA" },
    perfil: { to: "/profile", nome: "Perfil" },
    painel: { to: "/admin", nome: "Painel" },
    home: { to: "/", nome: "Página inicial" },
    login: { to: "/login", nome: "Login" },
    cadastro: { to: "/signup", nome: "Cadastro" },
    senha: { to: "/esqueci-senha", nome: "Recuperação de senha" },
};

const PERGUNTA =
    "Olá! Deseja ativar o assistente de voz? Com ele, você poderá ouvir os textos e navegar pelo GoodVib com mais facilidade. Se o navegador pedir permissão para usar o microfone, aceite. Depois, diga sim ou não.";
const ORIENTACAO_TECLADO = " Pressione Enter para ativar ou Escape para recusar.";
const TEMPO_RESPOSTA_MS = 15000;

export function AssistenteVozProvider({ children }: { children: ReactNode }) {
    const [prefs, setPrefs] = useState<PrefsVoz>(PREFS_PADRAO);
    const [carregado, setCarregado] = useState(false);
    const [mic, setMic] = useState<EstadoMic>("inativo");
    const [aviso, setAviso] = useState("");
    const [respondendo, setRespondendo] = useState(false);
    const fala = sintese.useFala();
    const navigate = useNavigate();
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    const prefsRef = useRef(prefs);
    const recRef = useRef<Reconhecedor | null>(null);
    const tratarRef = useRef<(c: Comando) => void>(() => { });
    const ultimoCmd = useRef({ c: "", t: 0 });
    const ultimoClique = useRef(0);
    const respondendoRef = useRef(false);
    const timerResposta = useRef<number | undefined>(undefined);
    const pathnameRef = useRef(pathname);
    const anuncioRef = useRef<{ to: string; texto: string } | null>(null);
    pathnameRef.current = pathname;

    function salvar(parcial: Partial<PrefsVoz>) {
        const novo = { ...prefsRef.current, ...parcial };
        prefsRef.current = novo;
        setPrefs(novo);
        salvarPrefs(novo);
    }

    const dizer = (t: string) => sintese.falar(t, prefsRef.current.velocidade);

    function pararMic() {
        recRef.current?.parar();
        recRef.current = null;
        setMic("inativo");
    }

    function encerrarResposta() {
        window.clearTimeout(timerResposta.current);
        respondendoRef.current = false;
        setRespondendo(false);
    }

    function iniciarMic(modo: ModoReconhecimento = "comandos") {
        if (!reconhecimentoSuportado()) {
            setMic("sem-suporte");
            const msg = "Comandos por voz não são compatíveis com este navegador. O assistente continua funcionando pelos botões.";
            setAviso(msg);
            dizer(msg);
            return;
        }
        recRef.current?.parar();
        const rec = criarReconhecedor({
            modo,
            aoComando: (c) => tratarRef.current(c),
            aoEstado: () => setMic("ouvindo"),
            aoErro: (e) => {
                recRef.current?.parar();
                recRef.current = null;
                setMic("erro");
                const emResposta = respondendoRef.current;
                if (emResposta) encerrarResposta();
                const msg = ERROS_MIC[e] + (emResposta ? ORIENTACAO_TECLADO : "");
                setAviso(msg);
                dizer(msg); // o erro também é falado
            },
        });
        recRef.current = rec;
        setMic("solicitando"); // o navegador pede a permissão do microfone aqui
        setAviso(modo === "resposta" ? "Ouvindo sua resposta. Diga sim ou não." : "Comandos por voz ativados. O microfone está ouvindo.");
        rec?.iniciar();
    }

    /** Pergunta inicial falada; liga o microfone ao terminar e entende "sim" ou "não" */
    function perguntarPorVoz() {
        if (!sintese.falaSuportada()) {
            setAviso("Seu navegador não oferece leitura por voz.");
            return;
        }
        if (!reconhecimentoSuportado()) {
            dizer("Seu navegador não permite responder por voz." + ORIENTACAO_TECLADO);
            return;
        }
        encerrarResposta();
        respondendoRef.current = true;
        setRespondendo(true);
        sintese.falar(PERGUNTA, prefsRef.current.velocidade, {
            aoTerminar: () => {
                if (!respondendoRef.current) return;
                iniciarMic("resposta");
                timerResposta.current = window.setTimeout(() => {
                    if (!respondendoRef.current) return;
                    pararMic();
                    encerrarResposta();
                    const msg = "Não ouvi sua resposta." + ORIENTACAO_TECLADO;
                    setAviso(msg);
                    dizer(msg);
                }, TEMPO_RESPOSTA_MS);
            },
        });
    }

    function ativar(mensagem = "Assistente de voz ativado. Clique em um texto ou botão para ouvi-lo.") {
        if (respondendoRef.current) {
            encerrarResposta();
            pararMic();
        }
        salvar({ ativo: true, respondido: true });
        setAviso("Assistente de voz ativado.");
        dizer(mensagem);
    }

    function desativar(manterMic = false) {
        sintese.parar();
        salvar({ ativo: false });
        if (!manterMic) pararMic();
        setAviso("Assistente de voz desativado.");
    }

    function irPara(destino: Destino) {
        const d = DESTINOS[destino];
        if (pathnameRef.current === d.to) {
            dizer(`Você já está em ${d.nome}.`);
            return;
        }
        anuncioRef.current = { to: d.to, texto: `${d.nome}.` }; // falado ao chegar na página
        navigate({ to: d.to });
    }

    tratarRef.current = (c) => {
        // Resposta à pergunta inicial
        if (c === "sim" || c === "nao") {
            if (!respondendoRef.current) return;
            encerrarResposta();
            pararMic();
            if (c === "sim") {
                ativar(
                    "Assistente de voz ativado. Comandos por voz ligados. Diga, por exemplo: ir para mensagens, ir para o perfil, parar leitura, ou desativar assistente de voz.",
                );
                iniciarMic();
            } else {
                salvar({ respondido: true, ativo: false });
                dizer("Tudo bem. O assistente continua desativado. Você pode ativá-lo pelo botão de acessibilidade.");
            }
            return;
        }

        const agora = Date.now();
        if (c === ultimoCmd.current.c && agora - ultimoCmd.current.t < 1500) return;
        // Ignora o eco da própria fala (evita laços de ativar/desativar); "parar" sempre vale
        if (c !== "parar" && sintese.estaFalando(1000)) return;
        ultimoCmd.current = { c, t: agora };

        if (c === "ativar") {
            if (!prefsRef.current.ativo) ativar();
        } else if (c === "desativar") {
            if (prefsRef.current.ativo) desativar(true); // mantém o microfone para poder reativar por voz
        } else if (c === "parar") sintese.parar();
        else if (c === "repetir") {
            if (prefsRef.current.ativo) sintese.repetir(prefsRef.current.velocidade);
        } else if (c.startsWith("ir:")) {
            if (prefsRef.current.ativo) irPara(c.slice(3) as Destino);
        }
    };

    // Carrega preferências, aquece vozes e limpa tudo ao desmontar
    useEffect(() => {
        const p = lerPrefs();
        prefsRef.current = p;
        setPrefs(p);
        setCarregado(true);
        const limpaVozes = sintese.prepararVozes();
        const aoSair = () => sintese.parar();
        window.addEventListener("pagehide", aoSair);
        return () => {
            window.removeEventListener("pagehide", aoSair);
            window.clearTimeout(timerResposta.current);
            limpaVozes();
            recRef.current?.parar();
            recRef.current = null;
        };
    }, []);

    // Ao trocar de rota: anuncia o destino (se veio de um comando de voz) ou para a leitura
    useEffect(() => {
        const anuncio = anuncioRef.current;
        anuncioRef.current = null;
        if (anuncio && anuncio.to === pathname) dizer(anuncio.texto);
        else sintese.parar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Um único listener global (não depende de rota, não acumula)
    useEffect(() => {
        if (!carregado || !prefs.ativo) return;
        const aoClicar = (e: MouseEvent) => {
            if (e.button !== 0) return;
            const agora = Date.now();
            if (agora - ultimoClique.current < 120) return; // clique sintético de <label>
            const texto = textoParaLer(e.target);
            if (!texto) return;
            ultimoClique.current = agora;
            sintese.falar(texto, prefsRef.current.velocidade);
        };
        const aoTeclar = (e: KeyboardEvent) => {
            if (e.key === "Escape") sintese.parar();
        };
        // captura, sem preventDefault/stopPropagation: a ação original continua igual
        document.addEventListener("click", aoClicar, true);
        document.addEventListener("keydown", aoTeclar);
        return () => {
            document.removeEventListener("click", aoClicar, true);
            document.removeEventListener("keydown", aoTeclar);
        };
    }, [carregado, prefs.ativo]);

    const valor: AssistenteCtx = {
        carregado,
        prefs,
        fala,
        falaSuportada: carregado && sintese.falaSuportada(),
        mic,
        aviso,
        respondendo,
        ativar: () => ativar(),
        desativar: () => desativar(false),
        recusar: () => {
            if (respondendoRef.current) {
                encerrarResposta();
                pararMic();
            }
            sintese.parar();
            salvar({ respondido: true, ativo: false });
        },
        alternar: () => (prefsRef.current.ativo ? desativar(false) : ativar()),
        definirVelocidade: (v) => salvar({ velocidade: v }),
        amostra: () => dizer("Esta é a velocidade de leitura selecionada."),
        pausar: sintese.pausar,
        retomar: sintese.retomar,
        parar: sintese.parar,
        alternarComandos: () => {
            if (mic === "ouvindo" || mic === "solicitando") {
                pararMic();
                setAviso("Comandos por voz desativados. O microfone foi desligado.");
            } else iniciarMic();
        },
        perguntarPorVoz,
    };

    return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}