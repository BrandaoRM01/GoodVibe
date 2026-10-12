import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { ArrowLeft, ArrowDown, Mic, Search, Send, Square } from "lucide-react";
import { motion } from "framer-motion";
import { RotaProtegida } from "@/components/RotaProtegida";
import { AvatarUsuario, PerfilUsuarioLink } from "@/components/UsuarioAdminUI";
import { BotaoSeguir } from "@/components/BotaoSeguir";
import { CartaoPostagemCompartilhada } from "@/components/CartaoPostagemCompartilhada";
import { useUsuarioAtual } from "@/lib/use-auth";
import { useIdsSeguindo } from "@/lib/use-seguidores";
import { useAgora, useConversa, useConversas } from "@/lib/use-mensagens";
import {
  formatarHoraConversa,
  formatarHoraMensagem,
  type ConversaListaAPI,
  type MensagemLocal,
} from "@/lib/mensagens";

interface MensagensSearch {
  com?: string;
}

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Mensagens — GoodVib&" }] }),
  validateSearch: (search: Record<string, unknown>): MensagensSearch => ({
    com: typeof search.com === "string" && search.com ? search.com : undefined,
  }),
  component: MessagesPage,
});

const MAX_MENSAGEM = 2000;
const PLACEHOLDER_PADRAO = "Escreva uma mensagem gentil...";
const PLACEHOLDER_OUVINDO = "Ouvindo... fale agora";

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

function MessagesPage() {
  return (
    <RotaProtegida>
      <MessagesConteudo />
    </RotaProtegida>
  );
}

function MessagesConteudo() {
  const { com } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex h-[calc(100dvh-4.5rem)] md:h-dvh">
        <ListaConversas
          ativo={com}
          onAbrir={(email) => navigate({ search: { com: email } })}
          className={com ? "hidden md:flex" : "flex"}
        />
        <PainelConversa
          key={com ?? "nenhuma"}
          email={com}
          onVoltar={() => navigate({ search: {} })}
          className={com ? "flex" : "hidden md:flex"}
        />
      </main>
      <MobileNav />
    </div>
  );
}

function previaConversa(c: ConversaListaAPI, meuEmail?: string): string {
  if (!c.ultimaMensagem) return "Nenhuma mensagem ainda";
  const minha = c.ultimaMensagem.remetenteEmail.toLowerCase() === meuEmail?.toLowerCase();
  const texto = c.ultimaMensagem.tipo === "postagem" ? "Publicação compartilhada" : (c.ultimaMensagem.conteudo ?? "");
  return minha ? `Você: ${texto}` : texto;
}

function ListaConversas({
  ativo,
  onAbrir,
  className,
}: {
  ativo?: string;
  onAbrir: (email: string) => void;
  className: string;
}) {
  const { data: usuarioAtual } = useUsuarioAtual();
  const { data, isLoading, isError, refetch } = useConversas();
  const [busca, setBusca] = useState("");
  const agora = useAgora();

  const termo = busca.trim().toLowerCase();
  const lista = (data ?? []).filter((c) => !termo || c.usuario.username.toLowerCase().includes(termo));

  return (
    <div className={`${className} w-full md:w-80 shrink-0 border-r border-border flex-col bg-sidebar/40`}>
      <div className="p-5 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight mb-3">Mensagens</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            maxLength={50}
            placeholder="Buscar conversa..."
            className="w-full bg-card border border-border rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Carregando conversas...</p>}

        {isError && (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-destructive">Não foi possível carregar as conversas.</p>
            <button type="button" onClick={() => refetch()} className="text-xs font-semibold text-primary">
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !isError && (data ?? []).length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8 px-4">
            Você ainda não segue ninguém. Siga pessoas para conversar com elas.
          </p>
        )}

        {!isLoading && !isError && (data ?? []).length > 0 && lista.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma conversa encontrada.</p>
        )}

        {lista.map((c, i) => {
          const novoGrupo = i === 0 || lista[i - 1].segueDeVolta !== c.segueDeVolta;
          const selecionada = ativo?.toLowerCase() === c.usuario.email.toLowerCase();
          return (
            <Fragment key={c.usuario.email}>
              {novoGrupo && (
                <h2 className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.segueDeVolta ? "Seguem você de volta" : "Você segue"}
                </h2>
              )}
              <button
                type="button"
                onClick={() => onAbrir(c.usuario.email)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${selecionada ? "bg-primary/10" : "hover:bg-accent"
                  }`}
              >
                <AvatarUsuario url={c.usuario.url_foto} nome={c.usuario.username} className="h-12 w-12" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${c.naoLidas > 0 ? "font-bold" : "font-semibold"}`}>
                      {c.usuario.username}
                    </p>
                    {c.ultimaAtividade && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatarHoraConversa(c.ultimaAtividade, agora)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs truncate ${c.naoLidas > 0
                        ? "text-foreground font-medium"
                        : c.ultimaMensagem
                          ? "text-muted-foreground"
                          : "text-muted-foreground/70 italic"
                      }`}
                  >
                    {previaConversa(c, usuarioAtual?.email)}
                  </p>
                </div>
                {c.naoLidas > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                    {c.naoLidas}
                  </span>
                )}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function PainelConversa({
  email,
  onVoltar,
  className,
}: {
  email?: string;
  onVoltar: () => void;
  className: string;
}) {
  const { data: usuarioAtual } = useUsuarioAtual();
  const meuEmail = usuarioAtual?.email;
  const { data: ids } = useIdsSeguindo();
  const conv = useConversa(email, meuEmail);

  const [texto, setTexto] = useState("");
  const [novasAbaixo, setNovasAbaixo] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [erroVoz, setErroVoz] = useState("");

  const rolagemRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const pertoDoFimRef = useRef(true);
  const restaurarRef = useRef<number | null>(null);
  const chaveAnteriorRef = useRef("");
  const reconhecimentoRef = useRef<ReconhecimentoVoz | null>(null);
  const baseDitadoRef = useRef("");

  const mensagens = conv.mensagens;

  useLayoutEffect(() => {
    const el = rolagemRef.current;
    if (!el) return;

    // Ao carregar mensagens antigas, mantém a posição de leitura
    if (restaurarRef.current !== null) {
      el.scrollTop = el.scrollHeight - restaurarRef.current;
      restaurarRef.current = null;
      return;
    }

    const ultima = mensagens[mensagens.length - 1];
    if (!ultima) return;

    const chave = String(ultima.clientId ?? ultima.id);
    if (chave === chaveAnteriorRef.current) return;

    const primeira = chaveAnteriorRef.current === "";
    chaveAnteriorRef.current = chave;

    if (primeira) {
      el.scrollTop = el.scrollHeight;
      return;
    }

    if (ultima.remetenteEmail === meuEmail || pertoDoFimRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      setNovasAbaixo(false);
    } else {
      setNovasAbaixo(true);
    }
  }, [mensagens, meuEmail]);

  useEffect(() => {
    return () => pararVoz();
  }, []);

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

  function aoRolar() {
    const el = rolagemRef.current;
    if (!el) return;
    pertoDoFimRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (pertoDoFimRef.current) setNovasAbaixo(false);
  }

  function irParaOFim() {
    rolagemRef.current?.scrollTo({ top: rolagemRef.current.scrollHeight, behavior: "smooth" });
    setNovasAbaixo(false);
  }

  function carregarAnteriores() {
    const el = rolagemRef.current;
    if (el) restaurarRef.current = el.scrollHeight - el.scrollTop;
    void conv.carregarMais();
  }

  if (!email) {
    return (
      <div className={`${className} flex-1 items-center justify-center text-sm text-muted-foreground`}>
        Selecione uma conversa para começar. 💛
      </div>
    );
  }

  const carregouSeguindo = ids !== undefined;
  const podeEnviar = ids?.some((e) => e.toLowerCase() === email.toLowerCase()) ?? false;
  const bloqueadoPorSeguir = carregouSeguindo && !podeEnviar;
  const campoDesabilitado = !carregouSeguindo || !podeEnviar || !!conv.erro;
  const nome = conv.usuario?.username ?? "";
  const ultimaMinhaId = [...mensagens]
    .reverse()
    .find((m) => m.remetenteEmail === meuEmail && m.id !== null)?.id;

  function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || !podeEnviar) return;
    pararVoz();
    setErroVoz("");
    setTexto("");
    void conv.enviar(conteudo);
  }

  return (
    <div className={`${className} flex-1 min-w-0 flex-col`}>
      <header className="flex items-center gap-3 p-4 border-b border-border glass">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar"
          className="md:hidden h-10 w-10 rounded-full hover:bg-accent grid place-items-center transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {conv.usuario ? (
          <PerfilUsuarioLink email={conv.usuario.email} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
            <AvatarUsuario url={conv.usuario.url_foto} nome={conv.usuario.username} className="h-11 w-11" />
            <p className="font-semibold truncate">{conv.usuario.username}</p>
          </PerfilUsuarioLink>
        ) : (
          <p className="font-semibold text-muted-foreground">{conv.erro ? "Conversa" : "Carregando..."}</p>
        )}
      </header>

      <div className="relative flex-1 min-h-0">
        <div ref={rolagemRef} onScroll={aoRolar} className="h-full overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-2">
          {conv.carregando && <p className="text-center text-sm text-muted-foreground py-8">Carregando mensagens...</p>}

          {conv.erro && (
            <p className="text-center text-sm text-destructive py-8">{conv.erro}</p>
          )}

          {conv.temMais && (
            <div className="text-center pb-2">
              <button
                type="button"
                onClick={carregarAnteriores}
                disabled={conv.carregandoMais}
                className="text-xs font-semibold text-primary disabled:opacity-60"
              >
                {conv.carregandoMais ? "Carregando..." : "Carregar mensagens anteriores"}
              </button>
            </div>
          )}

          {!conv.carregando && !conv.erro && mensagens.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma mensagem ainda. Diga um oi{nome ? ` para ${nome}` : ""}! 👋
            </p>
          )}

          {mensagens.map((m) => (
            <Bolha
              key={m.clientId ?? `id-${m.id}`}
              mensagem={m}
              minha={m.remetenteEmail === meuEmail}
              mostrarVisto={m.id !== null && m.id === ultimaMinhaId && m.lida}
              onReenviar={() => m.clientId && m.conteudo && void conv.enviar(m.conteudo, m.clientId)}
              onDescartar={() => m.clientId && conv.descartar(m.clientId)}
            />
          ))}
        </div>

        {novasAbaixo && (
          <button
            type="button"
            onClick={irParaOFim}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-semibold px-4 py-2 shadow-glow"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Novas mensagens
          </button>
        )}
      </div>

      <div className="p-4 border-t border-border">
        {bloqueadoPorSeguir && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {nome ? `Siga ${nome}` : "Siga esta pessoa"} para enviar mensagens.
            </p>
            <BotaoSeguir email={email} />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
          className="flex items-center gap-2 bg-card border border-border rounded-full pl-4 pr-2 py-2 focus-within:ring-2 focus-within:ring-primary/40 transition"
        >
          <input
            ref={campoRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={MAX_MENSAGEM}
            disabled={campoDesabilitado}
            aria-label="Mensagem"
            placeholder={ouvindo ? PLACEHOLDER_OUVINDO : PLACEHOLDER_PADRAO}
            className="flex-1 bg-transparent outline-none text-sm py-1.5 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={alternarVoz}
            disabled={campoDesabilitado}
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
            type="submit"
            disabled={!texto.trim() || !podeEnviar}
            aria-label="Enviar"
            className="h-9 w-9 shrink-0 rounded-full gradient-primary grid place-items-center text-primary-foreground hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {erroVoz && (
          <p role="alert" className="text-[11px] text-destructive mt-1 pl-2">
            {erroVoz}
          </p>
        )}
      </div>
    </div>
  );
}

function Bolha({
  mensagem: m,
  minha,
  mostrarVisto,
  onReenviar,
  onDescartar,
}: {
  mensagem: MensagemLocal;
  minha: boolean;
  mostrarVisto: boolean;
  onReenviar: () => void;
  onDescartar: () => void;
}) {
  const ehPostagem = m.tipo === "postagem" && m.postagem;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col ${minha ? "items-end" : "items-start"}`}
    >
      {ehPostagem ? (
        <CartaoPostagemCompartilhada postagem={m.postagem!} />
      ) : (
        <div
          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-3xl text-sm whitespace-pre-wrap break-words ${minha
              ? `gradient-primary text-primary-foreground rounded-br-md shadow-soft ${m.status === "enviando" ? "opacity-70" : ""}`
              : "bg-card border border-border rounded-bl-md"
            }`}
        >
          {m.conteudo}
        </div>
      )}

      {m.status === "falhou" ? (
        <p className="mt-1 text-[11px] text-destructive">
          {m.erro ?? "Não foi possível enviar."}{" "}
          <button type="button" onClick={onReenviar} className="font-semibold underline">
            Tentar novamente
          </button>{" "}
          ·{" "}
          <button type="button" onClick={onDescartar} className="font-semibold underline">
            Descartar
          </button>
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-muted-foreground">
          {m.status === "enviando" ? "Enviando..." : formatarHoraMensagem(m.criadoEm)}
          {mostrarVisto ? " · Visto" : ""}
        </p>
      )}
    </motion.div>
  );
}