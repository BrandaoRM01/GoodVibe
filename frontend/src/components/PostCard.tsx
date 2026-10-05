import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, MoreHorizontal, Pencil, Trash2, Flag, Image, X, Send, Smile, Sparkles } from "lucide-react";
import { useCurtirPostagem, useDescurtirPostagem, useExcluirPostagem, useEditarPostagem } from "@/lib/use-postagens";
import { useUsuarioAtual } from "@/lib/use-auth";
import { useTheme } from "@/lib/theme";
import EmojiPicker, { Theme } from "emoji-picker-react";
import pt from "emoji-picker-react/dist/data/emojis-pt";
import { TagSearchBox } from "@/components/tag-search-box";
import { ToolBtn } from "@/components/toolbar-button";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { ComentariosModal } from "@/components/ComentariosModal";

const MAX_TAGS_EDICAO = 5;

export type Post = {
  id: string;
  author: string;
  authorEmail?: string;
  handle: string;
  avatar: string;
  avatarFotoUrl?: string;
  time: string;
  content: string;
  image?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
};

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likes, setLikes] = useState(post.likes);

  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const [totalComentarios, setTotalComentarios] = useState(post.comments);

  useEffect(() => {
    setTotalComentarios(post.comments);
  }, [post.comments]);

  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: usuarioAtual } = useUsuarioAtual();
  const excluirPostagem = useExcluirPostagem();

  const souAutor = usuarioAtual?.username?.trim().toLowerCase() === post.author?.trim().toLowerCase();
  const souAdmin = usuarioAtual?.tipo_usuario === "admin" || usuarioAtual?.tipo_usuario === "superadmin";

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    }
    if (menuAberto) document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [menuAberto]);

  const navigate = useNavigate();

  const curtirPostagem = useCurtirPostagem();
  const descurtirPostagem = useDescurtirPostagem();
  const enviando = curtirPostagem.isPending || descurtirPostagem.isPending;

  function handleToggleLike() {
    const novoEstado = !liked;

    setLiked(novoEstado);
    setLikes((n) => n + (novoEstado ? 1 : -1));

    const id = Number(post.id);
    const mutation = novoEstado ? curtirPostagem : descurtirPostagem;

    mutation.mutate(id, {
      onError: () => {
        setLiked(!novoEstado);
        setLikes((n) => n + (novoEstado ? -1 : 1));
      },
    });
  }

  const [editando, setEditando] = useState(false);
  const [textoEdicao, setTextoEdicao] = useState(post.content);
  const [tagsEdicao, setTagsEdicao] = useState<string[]>(post.tags.map((t) => t.replace(/^#+/, "")));
  const [mostrarBuscaTagEdicao, setMostrarBuscaTagEdicao] = useState(false);
  const [mostrarEmojisEdicao, setMostrarEmojisEdicao] = useState(false);
  const [imagemEdicao, setImagemEdicao] = useState<File | null>(null);
  const [removerImagemAtual, setRemoverImagemAtual] = useState(false);
  const [previewEdicaoUrl, setPreviewEdicaoUrl] = useState<string | null>(null);
  const inputImagemEdicaoRef = useRef<HTMLInputElement>(null);
  const textareaEdicaoRef = useRef<HTMLTextAreaElement>(null);

  const editarPostagem = useEditarPostagem();
  const { theme } = useTheme();

  const atingiuLimiteEdicao = tagsEdicao.length >= MAX_TAGS_EDICAO;

  useEffect(() => {
    if (!imagemEdicao) {
      setPreviewEdicaoUrl(null);
      return;
    }
    const url = URL.createObjectURL(imagemEdicao);
    setPreviewEdicaoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imagemEdicao]);

  useEffect(() => {
    if (editando) textareaEdicaoRef.current?.focus();
  }, [editando]);

  function filtrarPorTag(nome: string) {
    navigate({ to: "/feed", search: { tag: nome } });
  }

  function handleEditar() {
    setMenuAberto(false);
    setTextoEdicao(post.content);
    setTagsEdicao(post.tags.map((t) => t.replace(/^#+/, "")));
    setImagemEdicao(null);
    setRemoverImagemAtual(false);
    setMostrarBuscaTagEdicao(false);
    setMostrarEmojisEdicao(false);
    setEditando(true);
  }

  function handleCancelarEdicao() {
    setEditando(false);
    setImagemEdicao(null);
    setRemoverImagemAtual(false);
    setMostrarBuscaTagEdicao(false);
    setMostrarEmojisEdicao(false);
  }

  function adicionarTagEdicao(nome: string) {
    const limpo = nome.trim();
    if (!limpo || tagsEdicao.length >= MAX_TAGS_EDICAO) return;
    if (tagsEdicao.some((t) => t.toLowerCase() === limpo.toLowerCase())) return;
    setTagsEdicao((prev) => [...prev, limpo]);
  }

  function removerTagEdicao(nome: string) {
    setTagsEdicao((prev) => prev.filter((t) => t !== nome));
  }

  function inserirEmojiEdicao(emoji: string) {
    const textarea = textareaEdicaoRef.current;
    if (!textarea) {
      setTextoEdicao((prev) => prev + emoji);
      return;
    }

    const inicio = textarea.selectionStart ?? textoEdicao.length;
    const fim = textarea.selectionEnd ?? textoEdicao.length;
    const novoTexto = textoEdicao.slice(0, inicio) + emoji + textoEdicao.slice(fim);

    setTextoEdicao(novoTexto);

    requestAnimationFrame(() => {
      textarea.focus();
      const novaPosicao = inicio + emoji.length;
      textarea.setSelectionRange(novaPosicao, novaPosicao);
    });
  }
  function handleSalvarEdicao() {
    if (!textoEdicao.trim()) return;

    editarPostagem.mutate(
      {
        id: Number(post.id),
        payload: {
          conteudo: textoEdicao.trim(),
          imagem: imagemEdicao ?? undefined,
          removerImagem: removerImagemAtual,
          tags: tagsEdicao,
        },
      },
      {
        onSuccess: (data) => {
          toast.success(data.mensagem ?? "Postagem atualizada com sucesso!");
          setEditando(false);
        },
        onError: (err) => {
          const msg = err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.";
          toast.error(msg);
        },
      }
    );
  }

  function handleExcluir() {
    setMenuAberto(false);
    if (!window.confirm("Tem certeza que deseja excluir esta postagem?")) return;

    excluirPostagem.mutate(Number(post.id), {
      onSuccess: (data) => {
        toast.success(data.mensagem ?? "Postagem excluída com sucesso.");
      },
      onError: (err) => {
        const msg = err instanceof ApiError ? err.message : "Não foi possível excluir. Tente novamente.";
        toast.error(msg);
      },
    });
  }

  function handleDenunciar() {
    setMenuAberto(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-3xl bg-card border border-border p-5 shadow-soft hover:shadow-glow transition-shadow"
    >
      <header className="flex items-center gap-3">
        <PerfilLink
          email={post.authorEmail}
          className="h-11 w-11 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
        >
          {post.avatarFotoUrl ? (
            <img src={post.avatarFotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            post.avatar
          )}
        </PerfilLink>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <PerfilLink email={post.authorEmail} className="font-semibold text-sm hover:underline">
              {post.author}
            </PerfilLink>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{post.time}</span>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAberto((v) => !v)}
            disabled={editando}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent disabled:opacity-40"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuAberto && (
            <div className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-border bg-card shadow-soft py-1 overflow-hidden">
              {souAutor && (
                <button
                  onClick={handleEditar}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
              )}

              {(souAutor || souAdmin) && (
                <button
                  onClick={handleExcluir}
                  disabled={excluirPostagem.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-destructive hover:bg-accent disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  {excluirPostagem.isPending ? "Excluindo..." : "Excluir"}
                </button>
              )}

              {!souAutor && !souAdmin && (
                <button
                  onClick={handleDenunciar}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  <Flag className="h-4 w-4" />
                  Denunciar
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {!editando && (
        <>
          {post.image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border aspect-[16/10]">
              <img src={post.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <p className="mt-3 text-[17px] leading-relaxed">{post.content}</p>

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((t) => {
                const nomeLimpo = t.replace(/^#+/, "");
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => filtrarPorTag(nomeLimpo)}
                    className="text-sm px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                  >
                    #{nomeLimpo}
                  </button>
                );
              })}
            </div>
          )}

          <footer className="mt-4 pt-3 border-t border-border flex items-center gap-1 text-muted-foreground">
            <Action
              icon={<Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />}
              label={String(likes)}
              active={liked}
              disabled={enviando}
              onClick={handleToggleLike}
            />
            <Action
              icon={<MessageCircle className="h-4 w-4" />}
              label={String(totalComentarios)}
              onClick={() => setComentariosAbertos(true)}
            />
            <Action icon={<Share2 className="h-4 w-4" />} label={String(post.shares)} />
          </footer>
        </>
      )}

      {editando && (
        <div className="mt-3">
          {(previewEdicaoUrl || (post.image && !removerImagemAtual)) && (
            <div className="relative rounded-2xl overflow-hidden border border-border aspect-[16/10]">
              <img
                src={previewEdicaoUrl ?? post.image}
                alt="Pré-visualização da imagem"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (imagemEdicao) setImagemEdicao(null);
                  else setRemoverImagemAtual(true);
                }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white grid place-items-center backdrop-blur-sm transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <textarea
            ref={textareaEdicaoRef}
            value={textoEdicao}
            onChange={(e) => setTextoEdicao(e.target.value)}
            placeholder="Compartilhe uma boa vibração hoje..."
            rows={2}
            className="mt-3 w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground text-[17px]"
          />

          {tagsEdicao.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagsEdicao.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full bg-accent text-accent-foreground"
                >
                  #{t}
                  <button type="button" onClick={() => removerTagEdicao(t)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {mostrarBuscaTagEdicao && !atingiuLimiteEdicao && (
            <TagSearchBox
              tagsAtuais={tagsEdicao}
              onAdicionar={adicionarTagEdicao}
              disabled={editarPostagem.isPending}
              onFechar={() => setMostrarBuscaTagEdicao(false)}
            />
          )}

          {mostrarBuscaTagEdicao && atingiuLimiteEdicao && (
            <p className="mt-2 text-xs text-muted-foreground">
              Limite de {MAX_TAGS_EDICAO} tags por postagem atingido.
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <input
                ref={inputImagemEdicaoRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo) {
                    setImagemEdicao(arquivo);
                    setRemoverImagemAtual(false);
                  }
                }}
                className="hidden"
              />
              <ToolBtn icon={<Image className="h-4 w-4" />} onClick={() => inputImagemEdicaoRef.current?.click()} />

              <div className="relative">
                <ToolBtn
                  icon={<Smile className="h-4 w-4" />}
                  active={mostrarEmojisEdicao}
                  onClick={() => setMostrarEmojisEdicao((v) => !v)}
                />
                {mostrarEmojisEdicao && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMostrarEmojisEdicao(false)} />
                    <div className="absolute z-20 mt-2">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => inserirEmojiEdicao(emojiData.emoji)}
                        width={300}
                        height={250}
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                        lazyLoadEmojis
                        theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                        emojiData={pt}
                        searchPlaceHolder="Pesquisar emoji..."
                      />
                    </div>
                  </>
                )}
              </div>

              <ToolBtn
                icon={<Sparkles className="h-4 w-4" />}
                label={tagsEdicao.length > 0 ? `Boa ação (${tagsEdicao.length}/${MAX_TAGS_EDICAO})` : "Boa ação"}
                active={mostrarBuscaTagEdicao}
                onClick={() => setMostrarBuscaTagEdicao((v) => !v)}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelarEdicao}
                disabled={editarPostagem.isPending}
                className="text-xs font-medium px-4 py-2 rounded-full hover:bg-accent transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarEdicao}
                disabled={!textoEdicao.trim() || editarPostagem.isPending}
                className="inline-flex items-center gap-2 gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full shadow-soft hover:shadow-glow transition-all disabled:opacity-50"
              >
                {editarPostagem.isPending ? "Salvando..." : "Salvar"} <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ComentariosModal
        postagemId={Number(post.id)}
        aberto={comentariosAbertos}
        onFechar={() => setComentariosAbertos(false)}
        souAutorPostagem={souAutor}
        onTotalChange={setTotalComentarios}
      />
    </motion.article>
  );
}

function PerfilLink({
  email,
  className,
  children,
}: {
  email?: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (!email) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link to="/profile/$email" params={{ email }} className={className}>
      {children}
    </Link>
  );
}

function Action({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed ${active ? "text-primary" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}