import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { PostCard, type Post } from "@/components/PostCard";
import { Settings, MapPin, Calendar, Heart, Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Perfil — GoodVib&" }] }),
  component: ProfilePage,
});

const myPosts: Post[] = [
  { id: "p1", author: "Você", handle: "@voce", avatar: "V", time: "1d",
    content: "Comecei meu desafio de 30 dias de gentileza! Quem topa junto? 💖",
    tags: ["#30Dias", "#Gentileza"], likes: 142, comments: 28, shares: 9, goodDeed: "Desafio iniciado" },
  { id: "p2", author: "Você", handle: "@voce", avatar: "V", time: "3d",
    content: "Ajudei uma idosa com as compras hoje. Conversamos por uma hora — ela só queria companhia 🌷",
    tags: ["#Empatia", "#PequenosGestos"], likes: 312, comments: 64, shares: 22, goodDeed: "Companhia" },
];

const badges = [
  { name: "Coração de Ouro", icon: "💛", desc: "100 boas ações" },
  { name: "Empático", icon: "🌸", desc: "Nível 7" },
  { name: "Inspirador", icon: "✨", desc: "1k seguidores" },
  { name: "Voluntário", icon: "🤝", desc: "10 ações de campo" },
  { name: "Pioneiro", icon: "🚀", desc: "Membro fundador" },
  { name: "Sorriso", icon: "😊", desc: "Espalhou alegria" },
];

function ProfilePage() {
  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-3xl overflow-hidden h-52 sm:h-64 gradient-primary shadow-glow">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
        </motion.div>

        <div className="relative px-2 sm:px-6 -mt-16">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="flex items-end gap-4">
              <div className="h-32 w-32 rounded-full gradient-primary border-4 border-background shadow-glow grid place-items-center text-primary-foreground text-4xl font-bold">
                V
              </div>
              <div className="pb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Você Souza</h1>
                <p className="text-muted-foreground text-sm">@voce · Nível 7 Empático</p>
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
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> São Paulo, BR</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Entrou em mar/2024</span>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Boas ações", value: "142", icon: Heart },
              { label: "Seguidores", value: "1.2k", icon: Sparkles },
              { label: "Seguindo", value: "324", icon: Sparkles },
              { label: "Conquistas", value: "18", icon: Trophy },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card border border-border p-4 shadow-soft">
                <s.icon className="h-4 w-4 text-primary mb-1.5" />
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Level progress */}
          <div className="mt-4 rounded-2xl bg-card border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold">Progresso do nível 7 → 8</span>
              <span className="text-muted-foreground">2.140 / 3.000 XP</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: "71%" }} transition={{ duration: 1, ease: "easeOut" }} className="h-full gradient-primary rounded-full" />
            </div>
          </div>

          {/* Badges */}
          <h2 className="mt-8 mb-3 text-lg font-bold tracking-tight">Emblemas conquistados</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {badges.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="aspect-square rounded-2xl bg-card border border-border p-3 grid place-items-center text-center shadow-soft hover:shadow-glow hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <div className="text-3xl">{b.icon}</div>
                  <p className="mt-1 text-[11px] font-semibold leading-tight">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Posts */}
          <h2 className="mt-8 mb-3 text-lg font-bold tracking-tight">Suas publicações</h2>
          <div className="space-y-4 pb-10">
            {myPosts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
