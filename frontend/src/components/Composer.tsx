import { Image, Smile, Sparkles, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCriarPostagem, useSugestoesTags } from "@/lib/use-postagens";
import { useUsuarioAtual } from "@/lib/use-auth";
import { ApiError, API_URL } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import pt from "emoji-picker-react/dist/data/emojis-pt";

const MAX_TAGS = 5;

export function Composer() {
  const [text, setText] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreviewUrl, setImagemPreviewUrl] = useState<string | null>(null);
  const [mostrarBuscaTag, setMostrarBuscaTag] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inputImagemRef = useRef<HTMLInputElement>(null);
  const criarPostagem = useCriarPostagem();
  const { data: usuarioAtual } = useUsuarioAtual();
  const { theme } = useTheme();

  const avatarLetra = usuarioAtual?.username?.charAt(0)?.toUpperCase() ?? "?";
  const avatarFotoUrl = usuarioAtual?.url_foto ? `${API_URL}/${usuarioAtual.url_foto}` : null;

  const podePublicar = text.trim().length > 0 && !criarPostagem.isPending;
  const atingiuLimite = tags.length >= MAX_TAGS;

  useEffect(() => {
    if (!imagem) {
      setImagemPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imagem);
    setImagemPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  function handleSelecionarImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (arquivo) setImagem(arquivo);
  }

  function adicionarTag(nome: string) {
    const limpo = nome.trim();
    if (!limpo || atingiuLimite) return;
    if (tags.some((t) => t.toLowerCase() === limpo.toLowerCase())) return;
    setTags((prev) => [...prev, limpo]);
  }

  function removerTag(nome: string) {
    setTags((prev) => prev.filter((t) => t !== nome));
  }

  function inserirEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + emoji);
      return;
    }

    const inicio = textarea.selectionStart ?? text.length;
    const fim = textarea.selectionEnd ?? text.length;
    const novoTexto = text.slice(0, inicio) + emoji + text.slice(fim);

    setText(novoTexto);

    requestAnimationFrame(() => {
      textarea.focus();
      const novaPosicao = inicio + emoji.length;
      textarea.setSelectionRange(novaPosicao, novaPosicao);
    });
  }

  async function handlePublicar() {
    if (!podePublicar) return;
    setErro(null);

    try {
      await criarPostagem.mutateAsync({
        conteudo: text.trim(),
        imagem: imagem ?? undefined,
        tags,
      });

      setText("");
      setImagem(null);
      setTags([]);
      setMostrarBuscaTag(false);
      if (inputImagemRef.current) inputImagemRef.current.value = "";
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível publicar. Tente novamente.");
    }
  }

  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0 overflow-hidden">
          {avatarFotoUrl ? (
            <img src={avatarFotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            avatarLetra
          )}
        </div>
        <p className="font-semibold text-sm">{usuarioAtual?.username ?? ""}</p>
      </div>

      {imagemPreviewUrl && (
        <div className="mt-3 relative rounded-2xl overflow-hidden border border-border aspect-[16/10]">
          <img src={imagemPreviewUrl} alt="Pré-visualização da imagem" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => setImagem(null)}
            disabled={criarPostagem.isPending}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white grid place-items-center backdrop-blur-sm transition-colors disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Compartilhe uma boa vibração hoje..."
        rows={2}
        disabled={criarPostagem.isPending}
        className="mt-3 w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground text-[15px] disabled:opacity-60"
      />

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground"
            >
              #{t}
              <button
                type="button"
                onClick={() => removerTag(t)}
                disabled={criarPostagem.isPending}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {mostrarBuscaTag && !atingiuLimite && (
        <TagSearchBox
          tagsAtuais={tags}
          onAdicionar={adicionarTag}
          disabled={criarPostagem.isPending}
          onFechar={() => setMostrarBuscaTag(false)}
        />
      )}

      {mostrarBuscaTag && atingiuLimite && (
        <p className="mt-2 text-xs text-muted-foreground">
          Limite de {MAX_TAGS} tags por postagem atingido.
        </p>
      )}

      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-muted-foreground">
          <input
            ref={inputImagemRef}
            type="file"
            accept="image/*"
            onChange={handleSelecionarImagem}
            className="hidden"
          />
          <ToolBtn icon={<Image className="h-4 w-4" />} onClick={() => inputImagemRef.current?.click()} />
          <div className="relative">
            <ToolBtn
              icon={<Smile className="h-4 w-4" />}
              active={mostrarEmojis}
              onClick={() => setMostrarEmojis((v) => !v)}
            />
            {mostrarEmojis && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMostrarEmojis(false)} />
                <div className="absolute z-20 mt-2">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => inserirEmoji(emojiData.emoji)}
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
            label={tags.length > 0 ? `Boa ação (${tags.length}/${MAX_TAGS})` : "Boa ação"}
            active={mostrarBuscaTag}
            onClick={() => setMostrarBuscaTag((v) => !v)}
          />
        </div>
        <button
          onClick={handlePublicar}
          disabled={!podePublicar}
          className="inline-flex items-center gap-2 gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full shadow-soft hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {criarPostagem.isPending ? "Publicando..." : "Publicar"} <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TagSearchBox({
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

function ToolBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors ${active ? "bg-primary/10 text-primary" : ""
        }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}