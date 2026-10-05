import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Heart, Send, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { API_URL, ApiError } from "@/lib/api";
import { useUsuarioAtual } from "@/lib/use-auth";
import {
  useComentarios,
  useRespostas,
  useCriarComentario,
  useEditarComentario,
  useExcluirComentario,
  useCurtirComentario,
} from "@/lib/use-comentarios";
import {
  formatarTempoComentario,
  MAX_CARACTERES_COMENTARIO,
  MAX_PROFUNDIDADE_COMENTARIO,
  type ComentarioAPI,
} from "@/lib/comentarios";

type ComentariosContexto = {
  postagemId: number;
  emailAtual?: string;
  podeModerar: boolean;
  souAutorPostagem: boolean;
  expandidos: Set<number>;
  alternarExpandido: (id: number) => void;
  irAoFim: Set<number>;
  concluirIrAoFim: (id: number) => void;
  responder: (comentario: ComentarioAPI) => void;
  aoMudarTotal: (total: number) => void;
  fechar: () => void;
};

const ComentariosCtx = createContext<ComentariosContexto | null>(null);

function useComentariosCtx() {
  const ctx = useContext(ComentariosCtx);
  if (!ctx) throw new Error("ComentariosCtx ausente");
  return ctx;
}

function mensagemErro(err: unknown, padrao: string) {
  return err instanceof ApiError ? err.message : padrao;
}

function Avatar({
  url,
  nome,
  email,
  onNavegar,
  className = "h-9 w-9",
}: {
  url?: string | null;
  nome?: string;
  email?: string;
  onNavegar?: () => void;
  className?: string;
}) {
  const circulo = (
    <div
      className={`${className} rounded-full gradient-primary grid place-items-center text-primary-foreground text-sm font-bold shrink-0 overflow-hidden`}
    >
      {url ? (
        <img src={`${API_URL}/${url}`} alt="" className="w-full h-full object-cover" />
      ) : (
        (nome?.charAt(0)?.toUpperCase() ?? "?")
      )}
    </div>
  );

  if (!email) return circulo;

  return (
    <Link
      to="/profile/$email"
      params={{ email }}
      onClick={onNavegar}
      className="shrink-0 self-start hover:opacity-80 transition-opacity"
      aria-label={`Ver perfil de ${nome ?? "usuário"}`}
    >
      {circulo}
    </Link>
  );
}

export function ComentariosModal({
  postagemId,
  aberto,
  onFechar,
  souAutorPostagem,
  onTotalChange,
}: {
  postagemId: number;
  aberto: boolean;
  onFechar: () => void;
  souAutorPostagem: boolean;
  onTotalChange: (total: number) => void;
}) {
  const { data: usuario } = useUsuarioAtual();

  const [texto, setTexto] = useState("");
  const [respondendo, setRespondendo] = useState<ComentarioAPI | null>(null);
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  // comentários cujas respostas devem ser carregadas até o fim (para mostrar a resposta recém-enviada)
  const [irAoFim, setIrAoFim] = useState<Set<number>>(new Set());

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useComentarios(
    postagemId,
    aberto
  );
  const criarComentario = useCriarComentario(postagemId);

  const comentarios = data?.pages.flatMap((p) => p.comentarios) ?? [];

  useEffect(() => {
    if (!aberto) {
      setTexto("");
      setRespondendo(null);
      setExpandidos(new Set());
      setIrAoFim(new Set());
    }
  }, [aberto]);

  // faz o campo de texto crescer conforme a pessoa digita (até um limite)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [texto]);

  function alternarExpandido(id: number) {
    setExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function concluirIrAoFim(id: number) {
    setIrAoFim((prev) => {
      if (!prev.has(id)) return prev;
      const novo = new Set(prev);
      novo.delete(id);
      return novo;
    });
  }

  function responder(comentario: ComentarioAPI) {
    setRespondendo(comentario);
    setTexto(`@${comentario.author} `);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function cancelarResposta() {
    if (respondendo && texto.trim() === `@${respondendo.author}`) setTexto("");
    setRespondendo(null);
  }

  function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || criarComentario.isPending) return;

    const alvo = respondendo;

    criarComentario.mutate(
      { postagemId, conteudo, comentarioPaiId: alvo?.id ?? null },
      {
        onSuccess: (resposta) => {
          onTotalChange(resposta.totalComentarios);
          setTexto("");
          setRespondendo(null);

          if (alvo) {
            // abre as respostas do comentário respondido e carrega até o fim para a pessoa ver a dela
            setExpandidos((prev) => new Set(prev).add(alvo.id));
            setIrAoFim((prev) => new Set(prev).add(alvo.id));
          } else {
            listaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }
        },
        onError: (err) => toast.error(mensagemErro(err, "Não foi possível comentar. Tente novamente.")),
      }
    );
  }

  const ctx: ComentariosContexto = {
    postagemId,
    emailAtual: usuario?.email,
    podeModerar: !!usuario?.pode_gerenciar_usuarios || usuario?.tipo_usuario === "admin",
    souAutorPostagem,
    expandidos,
    alternarExpandido,
    irAoFim,
    concluirIrAoFim,
    responder,
    aoMudarTotal: onTotalChange,
    fechar: onFechar,
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-[calc(100%-1.5rem)] max-w-xl h-[85vh] max-h-[760px] rounded-3xl sm:rounded-3xl bg-card border-border">
        <div className="px-5 py-4 border-b border-border text-center">
          <DialogTitle className="text-base">Comentários</DialogTitle>
          <DialogDescription className="sr-only">Comentários e respostas desta postagem</DialogDescription>
        </div>

        <div ref={listaRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <ComentariosCtx.Provider value={ctx}>
            {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Carregando comentários...</p>}

            {isError && (
              <p className="text-center text-sm text-destructive py-8">Não foi possível carregar os comentários.</p>
            )}

            {!isLoading && !isError && comentarios.length === 0 && (
              <div className="text-center py-12">
                <p className="font-semibold">Nenhum comentário ainda</p>
                <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a comentar.</p>
              </div>
            )}

            {comentarios.map((c) => (
              <ComentarioItem key={c.id} comentario={c} />
            ))}

            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="block mx-auto text-sm font-semibold text-primary hover:underline disabled:opacity-60"
              >
                {isFetchingNextPage ? "Carregando..." : "Ver mais comentários"}
              </button>
            )}
          </ComentariosCtx.Provider>
        </div>

        <div className="border-t border-border px-4 py-3">
          {!usuario ? (
            <p className="text-center text-sm text-muted-foreground">Entre na sua conta para comentar.</p>
          ) : (
            <>
              {respondendo && (
                <div className="mb-2 flex items-center justify-between rounded-full bg-accent px-3 py-1.5 text-xs">
                  <span className="truncate">
                    Respondendo a <b>@{respondendo.author}</b>
                  </span>
                  <button
                    type="button"
                    onClick={cancelarResposta}
                    className="ml-2 h-5 w-5 rounded-full grid place-items-center hover:bg-background/60"
                    aria-label="Cancelar resposta"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-3">
                <Avatar url={usuario.url_foto} nome={usuario.username} className="h-9 w-9 mb-0.5" />

                <div className="flex-1 min-w-0 rounded-2xl border border-border bg-background px-3 py-2">
                  <textarea
                    ref={inputRef}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        enviar();
                      }
                    }}
                    maxLength={MAX_CARACTERES_COMENTARIO}
                    rows={1}
                    placeholder={respondendo ? "Escreva uma resposta..." : "Adicione um comentário..."}
                    className="block w-full resize-none bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                  {texto.length > MAX_CARACTERES_COMENTARIO - 100 && (
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">
                      {texto.length}/{MAX_CARACTERES_COMENTARIO}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={enviar}
                  disabled={!texto.trim() || criarComentario.isPending}
                  className="h-10 w-10 mb-0.5 shrink-0 rounded-full gradient-primary text-primary-foreground grid place-items-center shadow-soft hover:shadow-glow transition-all disabled:opacity-50"
                  aria-label="Enviar comentário"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComentarioItem({ comentario }: { comentario: ComentarioAPI }) {
  const ctx = useComentariosCtx();

  const [curtido, setCurtido] = useState(comentario.curtidoPorMim);
  const [likes, setLikes] = useState(comentario.likes);
  const [editando, setEditando] = useState(false);
  const [textoEdicao, setTextoEdicao] = useState(comentario.content);

  // mantém o estado local alinhado quando a lista é recarregada
  useEffect(() => {
    setCurtido(comentario.curtidoPorMim);
    setLikes(comentario.likes);
  }, [comentario.curtidoPorMim, comentario.likes]);

  const curtirComentario = useCurtirComentario(ctx.postagemId);
  const editarComentario = useEditarComentario(ctx.postagemId);
  const excluirComentario = useExcluirComentario(ctx.postagemId);

  const souAutor = ctx.emailAtual === comentario.authorEmail;
  const podeExcluir = souAutor || ctx.souAutorPostagem || ctx.podeModerar;
  const podeResponder = comentario.depth < MAX_PROFUNDIDADE_COMENTARIO;

  function handleCurtir() {
    const novo = !curtido;
    setCurtido(novo);
    setLikes((n) => n + (novo ? 1 : -1));

    curtirComentario.mutate(
      { id: comentario.id, curtir: novo },
      {
        onError: (err) => {
          setCurtido(!novo);
          setLikes((n) => n + (novo ? -1 : 1));
          toast.error(mensagemErro(err, "Não foi possível curtir. Tente novamente."));
        },
      }
    );
  }

  function iniciarEdicao() {
    setTextoEdicao(comentario.content);
    setEditando(true);
  }

  function salvarEdicao() {
    const conteudo = textoEdicao.trim();
    if (!conteudo) return;
    if (conteudo === comentario.content) {
      setEditando(false);
      return;
    }

    editarComentario.mutate(
      { id: comentario.id, conteudo },
      {
        onSuccess: () => setEditando(false),
        onError: (err) => toast.error(mensagemErro(err, "Não foi possível salvar. Tente novamente.")),
      }
    );
  }

  function handleExcluir() {
    const aviso =
      comentario.replies > 0
        ? "Excluir este comentário também exclui as respostas dele. Continuar?"
        : "Tem certeza que deseja excluir este comentário?";
    if (!window.confirm(aviso)) return;

    excluirComentario.mutate(comentario.id, {
      onSuccess: (data) => {
        ctx.aoMudarTotal(data.totalComentarios);
        toast.success(data.mensagem ?? "Comentário excluído com sucesso.");
      },
      onError: (err) => toast.error(mensagemErro(err, "Não foi possível excluir. Tente novamente.")),
    });
  }

  return (
    <div>
      <div className="flex gap-3">
        <Avatar
          url={comentario.avatarUrl}
          nome={comentario.author}
          email={comentario.authorEmail}
          onNavegar={ctx.fechar}
          className={comentario.depth === 0 ? "h-9 w-9" : "h-7 w-7"}
        />

        <div className="flex-1 min-w-0">
          {!editando ? (
            <p className="text-sm leading-snug break-words whitespace-pre-wrap">
              <Link
                to="/profile/$email"
                params={{ email: comentario.authorEmail }}
                onClick={ctx.fechar}
                className="font-semibold mr-1.5 hover:underline"
              >
                {comentario.author}
              </Link>
              {comentario.content}
            </p>
          ) : (
            <div>
              <textarea
                value={textoEdicao}
                onChange={(e) => setTextoEdicao(e.target.value)}
                maxLength={MAX_CARACTERES_COMENTARIO}
                rows={2}
                autoFocus
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
              />
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={salvarEdicao}
                  disabled={!textoEdicao.trim() || editarComentario.isPending}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full gradient-primary text-primary-foreground disabled:opacity-50"
                >
                  {editarComentario.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  disabled={editarComentario.isPending}
                  className="text-xs font-medium px-3 py-1.5 rounded-full hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {formatarTempoComentario(comentario.time)}
              {comentario.edited && " · editado"}
            </span>
            {likes > 0 && (
              <span className="font-semibold">
                {likes} {likes === 1 ? "curtida" : "curtidas"}
              </span>
            )}
            {podeResponder && (
              <button
                type="button"
                onClick={() => ctx.responder(comentario)}
                className="font-semibold hover:text-foreground"
              >
                Responder
              </button>
            )}
            {souAutor && !editando && (
              <button type="button" onClick={iniciarEdicao} className="font-semibold hover:text-foreground">
                Editar
              </button>
            )}
            {podeExcluir && (
              <button
                type="button"
                onClick={handleExcluir}
                disabled={excluirComentario.isPending}
                className="font-semibold hover:text-destructive disabled:opacity-60"
              >
                {excluirComentario.isPending ? "Excluindo..." : "Excluir"}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCurtir}
          disabled={curtirComentario.isPending}
          className="self-start mt-1 p-1 rounded-full text-muted-foreground hover:text-primary transition-colors disabled:opacity-60"
          aria-label={curtido ? "Remover curtida" : "Curtir comentário"}
        >
          <Heart className={`h-4 w-4 ${curtido ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>

      {comentario.replies > 0 && (
        <div className={comentario.depth === 0 ? "ml-12 mt-3" : "ml-6 mt-3"}>
          <RespostasLista comentario={comentario} />
        </div>
      )}
    </div>
  );
}

function RespostasLista({ comentario }: { comentario: ComentarioAPI }) {
  const ctx = useComentariosCtx();
  const expandido = ctx.expandidos.has(comentario.id);

  const { data, isLoading, isError, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useRespostas(
    ctx.postagemId,
    comentario.id,
    expandido
  );

  const precisaIrAoFim = ctx.irAoFim.has(comentario.id);
  const { concluirIrAoFim } = ctx;

  useEffect(() => {
    if (!expandido || !precisaIrAoFim || isFetching) return;
    if (hasNextPage) fetchNextPage();
    else concluirIrAoFim(comentario.id);
  }, [expandido, precisaIrAoFim, isFetching, hasNextPage, fetchNextPage, concluirIrAoFim, comentario.id]);

  const respostas = data?.pages.flatMap((p) => p.comentarios) ?? [];
  const restantes = Math.max(comentario.replies - respostas.length, 0);

  const linkClasse = "text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60";

  if (!expandido) {
    return (
      <button type="button" onClick={() => ctx.alternarExpandido(comentario.id)} className={linkClasse}>
        — Ver {comentario.replies} {comentario.replies === 1 ? "resposta" : "respostas"}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {respostas.map((r) => (
        <ComentarioItem key={r.id} comentario={r} />
      ))}

      {isLoading && <p className="text-xs text-muted-foreground">Carregando respostas...</p>}
      {isError && <p className="text-xs text-destructive">Não foi possível carregar as respostas.</p>}

      <div className="flex items-center gap-4">
        {hasNextPage && (
          <button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className={linkClasse}>
            {isFetchingNextPage ? "Carregando..." : `— Ver mais respostas (${restantes})`}
          </button>
        )}
        <button type="button" onClick={() => ctx.alternarExpandido(comentario.id)} className={linkClasse}>
          Ocultar respostas
        </button>
      </div>
    </div>
  );
}