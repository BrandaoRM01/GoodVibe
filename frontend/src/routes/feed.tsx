import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { RightRail } from "@/components/RightRail";
import { Composer } from "@/components/Composer";
import { PostCard, type Post } from "@/components/PostCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search, Bell } from "lucide-react";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Feed — GoodVib&" }] }),
  component: FeedPage,
});

const posts: Post[] = [
  {
    id: "1", author: "Marina Costa", handle: "@marina", avatar: "M", time: "agora",
    content: "Hoje passei a manhã ajudando no abrigo de animais do bairro. Ver os olhinhos felizes me lembrou que pequenos gestos importam muito 🐾",
    image: "Foto: voluntariado no abrigo",
    tags: ["#GentilezaUrbana", "#Animais", "#Voluntariado"],
    likes: 284, comments: 42, shares: 12, goodDeed: "Voluntariado",
  },
  {
    id: "2", author: "Lucas Andrade", handle: "@lucas.a", avatar: "L", time: "2h",
    content: "Comprei o café e paguei o do próximo da fila. A reação dele fez meu dia ✨ Tente, é mais leve do que parece.",
    tags: ["#PayItForward", "#VibesPositivas"],
    likes: 156, comments: 23, shares: 8, goodDeed: "Café suspenso",
  },
  {
    id: "3", author: "Sofia Oliveira", handle: "@sofiaoli", avatar: "S", time: "4h",
    content: "Lembrete diário: você é mais gentil do que imagina. Continue 🌸",
    tags: ["#BemEstar", "#Autocuidado"],
    likes: 512, comments: 89, shares: 34,
  },
  {
    id: "4", author: "Rafael Mendes", handle: "@rafa.m", avatar: "R", time: "ontem",
    content: "Iniciamos uma horta comunitária no prédio. Quem quiser participar, comenta aí que mando os detalhes 🌱",
    tags: ["#Comunidade", "#Sustentabilidade"],
    likes: 198, comments: 56, shares: 21, goodDeed: "Iniciativa local",
  },
];

function FeedPage() {
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
          <Composer />
          {posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
        </div>
      </main>
      <MobileNav />
      <RightRail />
    </div>
  );
}
