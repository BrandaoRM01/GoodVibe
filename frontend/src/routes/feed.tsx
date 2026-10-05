import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { RightRail } from "@/components/RightRail";
import { Composer } from "@/components/Composer";
import { PostCard, type Post } from "@/components/PostCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search, Bell } from "lucide-react";
import { useFeed } from "@/lib/use-postagens";
import type { PostagemAPI } from "@/lib/postagens";
import { API_URL } from "@/lib/api";
import { X } from "lucide-react";

interface FeedSearch {
  tag?: string;
  autor?: string;
  compose?: boolean;
}

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Feed — GoodVib&" }] }),
  validateSearch: (search: Record<string, unknown>): FeedSearch => ({
    tag: typeof search.tag === "string" ? search.tag : undefined,
    autor: typeof search.autor === "string" ? search.autor : undefined,
    compose: search.compose === true || search.compose === "true" ? true : undefined,
  }),
  component: FeedPage,
});

function formatarData(dataStr: string | null): string {
  if (!dataStr) return "";

  const normalizado = dataStr.includes("T") ? dataStr : dataStr.replace(" ", "T");
  const data = new Date(normalizado);
  if (isNaN(data.getTime())) return dataStr;

  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHoras < 24) return `há ${diffHoras}h`;
  if (diffDias === 1) return "ontem";
  if (diffDias < 7) return `há ${diffDias}d`;

  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function mapearPostagem(p: PostagemAPI): Post {
  return {
    id: String(p.id),
    author: p.author,
    authorEmail: p.authorEmail,
    handle: p.handle,
    avatar: p.author?.charAt(0)?.toUpperCase() ?? "?",
    avatarFotoUrl: p.avatarUrl ? `${API_URL}/${p.avatarUrl}` : undefined,
    time: formatarData(p.time),
    content: p.content,
    image: p.image ? `${API_URL}/${p.image}` : undefined,
    tags: p.tags,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    liked: p.curtidoPorMim,
  };
}

function FeedPage() {
  const { tag, autor, compose } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: postagens, isLoading, isError, error } = useFeed(tag, autor);

  function limparTag() {
    navigate({ search: (prev) => ({ ...prev, tag: undefined }) });
  }

  function limparAutor() {
    navigate({ search: (prev) => ({ ...prev, autor: undefined }) });
  }

  function limparCompose() {
    navigate({ search: (prev) => ({ ...prev, compose: undefined }) });
  }

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4 glass border-b border-border flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight flex-1">Feed</h1>
          <button className="h-10 w-10 rounded-full border border-border bg-card hover:bg-accent grid place-items-center transition-colors">
            <Search className="h-4 w-4" />
          </button>
          <button className="h-10 w-10 rounded-full border border-border bg-card hover:bg-accent grid place-items-center transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </button>
          <ThemeToggle />
        </header>

        <div className="space-y-4">
          <Composer autoAbrir={compose} onAutoAbrirConsumido={limparCompose} />

          {(tag || autor) && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              {autor && <FiltroChip label={`@${autor}`} onRemover={limparAutor} />}
              {tag && <FiltroChip label={`#${tag}`} onRemover={limparTag} />}
            </div>
          )}

          {isLoading && (
            <p className="text-center text-sm text-muted-foreground py-8">Carregando feed...</p>
          )}

          {isError && (
            <p className="text-center text-sm text-destructive py-8">
              Não foi possível carregar o feed{error instanceof Error ? `: ${error.message}` : "."}
            </p>
          )}

          {!isLoading && !isError && postagens?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {tag || autor
                ? "Nenhuma postagem encontrada com esse filtro."
                : "Ainda não há postagens por aqui. Seja o primeiro a compartilhar algo bom!"}
            </p>
          )}

          {postagens?.map((p, i) => (
            <PostCard key={p.id} post={mapearPostagem(p)} index={i} />
          ))}
        </div>
      </main>
      <MobileNav />
      <RightRail />
    </div>
  );
}

function FiltroChip({ label, onRemover }: { label: string; onRemover: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 pl-3 pr-1.5 py-1 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemover}
        className="h-4 w-4 rounded-full grid place-items-center hover:bg-primary/20 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}