import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, Heart, Users, Trophy, Shield, MessageCircle,
  ArrowRight, Star, Smile, Check,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GoodVib& — Rede social das boas ações e boas vibrações" },
      { name: "description", content: "Uma rede social acolhedora focada em empatia, bem-estar e gentileza. Faça parte da GoodVib&." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#community" className="hover:text-foreground transition-colors">Comunidade</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Preview</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full hover:bg-accent transition-colors">
              Entrar
            </Link>
            <Link to="/signup" className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full shadow-soft hover:shadow-glow hover:scale-[1.03] transition-all">
              Criar conta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Bem-vindo ao lado bom da internet
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Pequenas ações, <span className="gradient-text">grandes vibrações</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              GoodVib& é a rede social que celebra empatia, bem-estar e gentileza.
              Compartilhe boas ações, inspire pessoas e construa uma comunidade
              mais leve, junto com quem acredita em conexões verdadeiras.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-full shadow-glow hover:scale-[1.03] transition-transform">
                Começar agora <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/feed" className="inline-flex items-center gap-2 bg-card border border-border font-semibold px-7 py-3.5 rounded-full hover:bg-accent transition-colors">
                Ver demonstração
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["A", "M", "L", "S"].map((c, i) => (
                  <div key={i} className="h-9 w-9 rounded-full gradient-primary border-2 border-background grid place-items-center text-primary-foreground font-bold text-xs">{c}</div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-warning">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-1">+120k pessoas espalhando boas vibrações</p>
              </div>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-10 gradient-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-[2rem] bg-card border border-border shadow-glow p-6 space-y-4">
              <FloatingPost author="Marina Costa" handle="@marina" deed="Doou roupas para abrigo" content="Pequenos gestos transformam o dia inteiro de alguém. ✨" likes={284} delay={0.3} />
              <FloatingPost author="Lucas Andrade" handle="@lucas.a" deed="Voluntariado" content="Hoje a gentileza apareceu nos olhos de quem ajudei." likes={156} delay={0.5} />
              <div className="rounded-2xl gradient-primary p-5 text-primary-foreground flex items-center gap-3 shadow-soft">
                <Trophy className="h-8 w-8" />
                <div>
                  <p className="font-bold text-sm">Você desbloqueou: Coração de Ouro</p>
                  <p className="text-xs opacity-90">+250 XP por inspirar a comunidade</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card/40">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Uma rede pensada para <span className="gradient-text">o seu bem-estar</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Recursos desenhados para fortalecer comunidades saudáveis e celebrar pequenas atitudes que mudam vidas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-3xl bg-card border border-border p-7 shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all"
              >
                <div className="h-12 w-12 rounded-2xl gradient-primary grid place-items-center text-primary-foreground mb-5 shadow-soft">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community / Stats */}
      <section id="community" className="py-24">
        <div className="max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Construa sua jornada de <span className="gradient-text">boas vibrações</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Ganhe XP, desbloqueie emblemas e veja seu impacto crescer com cada gesto positivo.
              Aqui, evoluir significa espalhar luz.
            </p>
            <ul className="space-y-3">
              {["Sistema de gamificação com níveis e conquistas",
                "Tags positivas e tendências que inspiram",
                "Moderação ativa para um espaço saudável",
                "Mensagens privadas com bolhas elegantes"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full gradient-primary grid place-items-center shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </span>
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-3xl bg-card border border-border p-6 shadow-soft">
                <s.icon className="h-6 w-6 text-primary mb-3" />
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="preview" className="py-24">
        <div className="max-w-5xl mx-auto px-5">
          <div className="relative rounded-[2.5rem] gradient-primary p-12 sm:p-16 text-center text-primary-foreground overflow-hidden shadow-glow">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <h2 className="relative text-4xl sm:text-5xl font-bold tracking-tight">
              Pronto para espalhar boas vibrações?
            </h2>
            <p className="relative mt-4 opacity-90 max-w-xl mx-auto">
              Junte-se a uma comunidade que acredita em pessoas e celebra cada gesto de gentileza.
            </p>
            <Link to="/signup" className="relative mt-8 inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-full hover:scale-[1.03] transition-transform">
              Criar minha conta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <p className="text-sm text-muted-foreground">© 2026 GoodVib&. Feito com <Heart className="inline h-3.5 w-3.5 text-primary fill-current" /> para inspirar boas ações.</p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: Heart, title: "Boas ações no centro", desc: "Marque suas postagens com gestos positivos e inspire outros a fazerem o mesmo." },
  { icon: Trophy, title: "Gamificação leve", desc: "Acumule XP, suba de nível e desbloqueie emblemas conforme espalha gentileza." },
  { icon: Shield, title: "Comunidade segura", desc: "Moderação ativa e ferramentas de cuidado para um ambiente respeitoso e acolhedor." },
  { icon: MessageCircle, title: "Conversas elegantes", desc: "Mensagens privadas com design moderno e fluido, inspirado nos melhores apps." },
  { icon: Users, title: "Tribo positiva", desc: "Encontre pessoas com vibrações parecidas e construa amizades reais." },
  { icon: Smile, title: "Bem-estar diário", desc: "Tendências que inspiram, conteúdo curado e zero pressão por curtidas." },
];

const stats = [
  { icon: Users, value: "120k+", label: "Membros ativos" },
  { icon: Heart, value: "2.3M", label: "Boas ações compartilhadas" },
  { icon: Trophy, value: "48k", label: "Emblemas desbloqueados" },
  { icon: Sparkles, value: "98%", label: "Sentem-se acolhidos" },
];

function FloatingPost({ author, handle, deed, content, likes, delay = 0 }: {
  author: string; handle: string; deed: string; content: string; likes: number; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl bg-background border border-border p-4 shadow-soft"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-sm">{author[0]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{author}</p>
          <p className="text-xs text-muted-foreground truncate">{handle}</p>
        </div>
        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
          ✨ {deed}
        </span>
      </div>
      <p className="text-sm">{content}</p>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> {likes}
      </div>
    </motion.div>
  );
}
