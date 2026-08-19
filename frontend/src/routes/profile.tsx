import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { PostCard, type Post } from "@/components/PostCard";
import { useUsuarioAtual } from "@/lib/use-auth";
import { useFeed } from "@/lib/use-postagens";
import type { PostagemAPI } from "@/lib/postagens";
import { Settings, MapPin, Calendar, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Perfil — GoodVib&" }] }),
  component: ProfilePage,
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

function mapPostagemParaPost(p: PostagemAPI): Post {
  return {
    id: String(p.id),
    author: p.author,
    handle: p.handle,
    avatar: p.author?.[0]?.toUpperCase() ?? "?",
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

function ProfilePage() {
  const { data: usuario, isLoading: carregandoUsuario } = useUsuarioAtual();
  const { data: postagensAPI, isLoading: carregandoFeed } = useFeed(undefined, usuario?.username, {
    enabled: !!usuario?.username,
  });
  const [abaAtiva, setAbaAtiva] = useState<"postagens" | "tweets">("postagens");

  const postagens = (postagensAPI ?? []).filter((p) => !!p.image).map(mapPostagemParaPost);
  const tweets = (postagensAPI ?? []).filter((p) => !p.image).map(mapPostagemParaPost);

  if (carregandoUsuario) {
    return (
      <div className="min-h-screen flex">
        <AppSidebar />
        <main className="flex-1 grid place-items-center text-muted-foreground">Carregando perfil...</main>
        <MobileNav />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex">
        <AppSidebar />
        <main className="flex-1 grid place-items-center text-muted-foreground">Faça login para ver seu perfil.</main>
        <MobileNav />
      </div>
    );
  }

  const inicial = usuario.username?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-3xl overflow-hidden h-52 sm:h-64 gradient-primary shadow-glow"
        >
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
        </motion.div>

        <div className="relative px-2 sm:px-6 -mt-16">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="flex items-end gap-4">
              <div className="h-32 w-32 rounded-full gradient-primary border-4 border-background shadow-glow grid place-items-center text-primary-foreground text-4xl font-bold overflow-hidden">
                {usuario.url_foto ? (
                  <img
                    src={`${API_URL}/${usuario.url_foto}`}
                    alt={usuario.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  inicial
                )}
              </div>
              <div className="pb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{usuario.username}</h1>
                <p className="text-muted-foreground text-sm">@{usuario.username}</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 bg-card border border-border font-semibold px-5 py-2.5 rounded-full hover:bg-accent transition-colors text-sm">
              <Settings className="h-4 w-4" /> Editar perfil
            </button>
          </div>

          <p className="mt-5 max-w-2xl text-[15px]">
            Acreditando que pequenas ações fazem grandes mudanças 🌸 Compartilho boas vibrações diariamente.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> São Paulo, BR
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Entrou em mar/2024
            </span>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Boas ações", value: String(usuario.qtd_postagens), icon: Heart },
              { label: "Seguidores", value: String(usuario.qtd_seguidores), icon: Sparkles },
              { label: "Seguindo", value: String(usuario.qtd_seguindo), icon: Sparkles },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card border border-border p-4 shadow-soft">
                <s.icon className="h-4 w-4 text-primary mb-1.5" />
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Seletor de aba: Postagens / Tweets */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={() => setAbaAtiva("postagens")}
              className={`rounded-2xl border p-4 text-center font-semibold transition-colors ${abaAtiva === "postagens"
                ? "bg-primary text-primary-foreground border-primary shadow-glow"
                : "bg-card border-border hover:bg-accent"
                }`}
            >
              Postagens
              <span className="block text-xs font-normal opacity-80 mt-0.5">
                {postagens.length} {postagens.length === 1 ? "publicação" : "publicações"}
              </span>
            </button>
            <button
              onClick={() => setAbaAtiva("tweets")}
              className={`rounded-2xl border p-4 text-center font-semibold transition-colors ${abaAtiva === "tweets"
                ? "bg-primary text-primary-foreground border-primary shadow-glow"
                : "bg-card border-border hover:bg-accent"
                }`}
            >
              Tweets
              <span className="block text-xs font-normal opacity-80 mt-0.5">
                {tweets.length} {tweets.length === 1 ? "tweet" : "tweets"}
              </span>
            </button>
          </div>

          {/* Conteúdo da aba selecionada */}
          <motion.div
            key={abaAtiva}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 pb-10"
          >
            {carregandoFeed ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : abaAtiva === "postagens" ? (
              postagens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma postagem com imagem ainda.</p>
              ) : (
                <div className="space-y-4">
                  {postagens.map((p, i) => (
                    <PostCard key={p.id} post={p} index={i} />
                  ))}
                </div>
              )
            ) : tweets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum tweet ainda.</p>
            ) : (
              <div className="space-y-4">
                {tweets.map((p, i) => (
                  <PostCard key={p.id} post={p} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}