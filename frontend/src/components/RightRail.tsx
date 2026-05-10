import { Flame, Trophy, TrendingUp, Heart } from "lucide-react";

const trends = [
  { tag: "#GentilezaUrbana", posts: "12.4k" },
  { tag: "#DoeSorrisos", posts: "8.7k" },
  { tag: "#VibesPositivas", posts: "23.1k" },
  { tag: "#AjudaQueTransforma", posts: "5.2k" },
];

const featured = [
  { name: "Marina Costa", handle: "@marina", avatar: "M", deeds: 142 },
  { name: "Lucas Andrade", handle: "@lucas.a", avatar: "L", deeds: 98 },
  { name: "Sofia Oliveira", handle: "@sofiaoli", avatar: "S", deeds: 76 },
];

export function RightRail() {
  return (
    <aside className="hidden xl:flex sticky top-0 h-screen w-80 shrink-0 flex-col gap-5 px-4 py-6 overflow-y-auto scrollbar-thin">
      <Card title="Tendências positivas" icon={<TrendingUp className="h-4 w-4" />}>
        <div className="space-y-3">
          {trends.map((t) => (
            <div key={t.tag} className="flex items-center justify-between group cursor-pointer">
              <div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{t.tag}</p>
                <p className="text-xs text-muted-foreground">{t.posts} publicações</p>
              </div>
              <Flame className="h-4 w-4 text-primary" />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Em destaque hoje" icon={<Heart className="h-4 w-4" />}>
        <div className="space-y-3">
          {featured.map((u) => (
            <div key={u.handle} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">
                {u.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.handle} · {u.deeds} boas ações</p>
              </div>
              <button className="text-xs font-semibold text-primary hover:underline">Seguir</button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Sua conquista" icon={<Trophy className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">Nível 7 · Empático</span>
            <span className="text-muted-foreground">2.140 / 3.000 XP</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-primary rounded-full" style={{ width: "71%" }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Complete 3 boas ações para desbloquear o emblema "Coração de Ouro" 💛
          </p>
        </div>
      </Card>
    </aside>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-4 text-primary">
        {icon}
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}
