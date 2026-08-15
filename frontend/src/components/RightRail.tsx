import { Flame, Trophy, TrendingUp, Heart } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTagsTendencias } from "@/lib/use-postagens";
import { useUsuariosDestaque } from "@/lib/use-usuarios";
import { API_URL } from "@/lib/api";

function formatarContagem(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function RightRail() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tag?: string; autor?: string };
  const { data: tendencias, isLoading } = useTagsTendencias();
  const { data: destaques, isLoading: carregandoDestaques } = useUsuariosDestaque();

  function filtrarPorTag(nome: string) {
    navigate({ to: "/feed", search: (prev: Record<string, unknown>) => ({ ...prev, tag: nome }) });
  }

  function filtrarPorUsuario(username: string) {
    navigate({ to: "/feed", search: (prev: Record<string, unknown>) => ({ ...prev, autor: username }) });
  }

  return (
    <aside className="hidden xl:flex sticky top-0 h-screen w-80 shrink-0 flex-col gap-5 px-4 py-6 overflow-y-auto scrollbar-thin">
      <Card title="Tendências positivas" icon={<TrendingUp className="h-4 w-4" />}>
        <div className="space-y-3">
          {isLoading && (
            <p className="text-xs text-muted-foreground">Carregando tendências...</p>
          )}

          {!isLoading && tendencias?.length === 0 && (
            <p className="text-xs text-muted-foreground">Ainda não há tendências.</p>
          )}

          {tendencias?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => filtrarPorTag(t.nome)}
              className={`w-full flex items-center justify-between group text-left ${search.tag === t.nome ? "text-primary" : ""
                }`}
            >
              <div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                  #{t.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatarContagem(t.totalPostagens)} publicações
                </p>
              </div>
              <Flame className="h-4 w-4 text-primary" />
            </button>
          ))}
        </div>
      </Card>

      <Card title="Em destaque hoje" icon={<Heart className="h-4 w-4" />}>
        <div className="space-y-3">
          {carregandoDestaques && (
            <p className="text-xs text-muted-foreground">Carregando destaques...</p>
          )}

          {!carregandoDestaques && destaques?.length === 0 && (
            <p className="text-xs text-muted-foreground">Ainda não há destaques.</p>
          )}

          {destaques?.map((u) => {
            const avatarLetra = u.username.charAt(0).toUpperCase();
            const avatarFotoUrl = u.url_foto ? `${API_URL}/${u.url_foto}` : null;
            const ativo = search.autor === u.username;

            return (
              <div key={u.email} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0 overflow-hidden cursor-default">
                  {avatarFotoUrl ? (
                    <img src={avatarFotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    avatarLetra
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => filtrarPorUsuario(u.username)}
                  className={`flex-1 min-w-0 text-left group ${ativo ? "text-primary" : ""}`}
                >
                  <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                    {u.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.totalPostagens} boas ações
                  </p>
                </button>

                <button className="text-xs font-semibold text-primary hover:underline shrink-0">
                  Seguir
                </button>
              </div>
            );
          })}
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