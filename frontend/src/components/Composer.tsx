import { Image, Smile, Sparkles, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCriarPostagem } from "@/lib/use-postagens";
import { useUsuarioAtual } from "@/lib/use-auth";
import { toast } from "sonner";
import { ApiError, API_URL } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import EmojiPicker, { Theme } from "emoji-picker-react";
import pt from "emoji-picker-react/dist/data/emojis-pt";
import { TagSearchBox } from "@/components/tag-search-box";
import { ToolBtn } from "@/components/toolbar-button";

const MAX_TAGS = 5;

interface ComposerProps {
  autoAbrir?: boolean;
  onAutoAbrirConsumido?: () => void;
}

export function Composer({ autoAbrir, onAutoAbrirConsumido }: ComposerProps) {
  const [text, setText] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreviewUrl, setImagemPreviewUrl] = useState<string | null>(null);
  const [mostrarBuscaTag, setMostrarBuscaTag] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
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
    if (!autoAbrir) return;
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    onAutoAbrirConsumido?.();
  }, [autoAbrir, onAutoAbrirConsumido]);

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

    try {
      await criarPostagem.mutateAsync({
        conteudo: text.trim(),
        imagem: imagem ?? undefined,
        tags,
      });

      toast.success("Postagem publicada com sucesso!");

      setText("");
      setImagem(null);
      setTags([]);
      setMostrarBuscaTag(false);
      if (inputImagemRef.current) inputImagemRef.current.value = "";
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Não foi possível publicar. Tente novamente.";
      toast.error(msg);
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
        className="mt-3 w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground text-[17px] disabled:opacity-60"
      />

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full bg-accent text-accent-foreground"
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