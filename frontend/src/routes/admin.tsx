import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { UsuariosAdminModal } from "@/components/UsuariosAdminModal";
import { AvatarUsuario, TipoUsuarioBadge, PerfilUsuarioLink } from "@/components/UsuarioAdminUI";
import { useResumoAdmin } from "@/lib/use-admin";
import {
  Users, Heart, Flag, TrendingUp, MoreHorizontal, Search, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { AcoesUsuarioAdmin } from "@/components/AcoesUsuarioAdmin";
import { RotaProtegida } from "@/components/RotaProtegida";
import { useDenunciasPainel } from "@/lib/use-denuncias";
import { ItemDenuncia } from "@/components/DenunciasAdminUI";
import { DenunciasAdminModal } from "@/components/DenunciasAdminModal";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel administrativo — GoodVib&" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <RotaProtegida apenasAdmin>
      <AdminConteudo />
    </RotaProtegida>
  );
}

type Kpi = {
  label: string;
  value: string;
  trend: string | null;
  trendNegativo?: boolean;
  hint?: string;
  icon: LucideIcon;
};

function formatarVariacao(v: number | null | undefined) {
  if (v === null || v === undefined) return null;
  return `${v > 0 ? "+" : ""}${v.toLocaleString("pt-BR")}%`;
}

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
};

function AdminConteudo() {
  const { data: resumo, isLoading, isError } = useResumoAdmin();
  const { data: painelDenuncias, isLoading: carregandoDenuncias } = useDenunciasPainel();
  const [verTodos, setVerTodos] = useState(false);
  const [verDenuncias, setVerDenuncias] = useState(false);

  const variacaoAtivos = resumo?.kpis.usuariosAtivos.variacao;
  const variacaoBoasAcoes = resumo?.kpis.boasAcoesHoje.variacao;

  const kpis: Kpi[] = [
    {
      label: "Usuários ativos",
      value: resumo ? resumo.kpis.usuariosAtivos.valor.toLocaleString("pt-BR") : "—",
      trend: formatarVariacao(variacaoAtivos),
      trendNegativo: (variacaoAtivos ?? 0) < 0,
      hint: "Usuários que postaram ou comentaram nos últimos 30 dias (variação sobre os 30 dias anteriores)",
      icon: Users,
    },
    {
      label: "Boas ações hoje",
      value: resumo ? resumo.kpis.boasAcoesHoje.valor.toLocaleString("pt-BR") : "—",
      trend: formatarVariacao(variacaoBoasAcoes),
      trendNegativo: (variacaoBoasAcoes ?? 0) < 0,
      hint: "Postagens aprovadas hoje (variação sobre ontem)",
      icon: Heart,
    },
    {
      label: "Engajamento",
      value: resumo ? `${resumo.kpis.engajamento.valor}%` : "—",
      trend: null,
      hint: "Percentual de usuários ativos nos últimos 30 dias em relação ao total de usuários",
      icon: TrendingUp,
    },
    {
      label: "Denúncias abertas",
      value: resumo ? resumo.denunciasAbertas.toLocaleString("pt-BR") : "—",
      trend: null,
      hint: "Denúncias de postagens e comentários aguardando análise",
      icon: Flag,
    },
  ];

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 max-w-7xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Painel administrativo
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">Visão geral</h1>
          </div>
        </header>

        {isError && (
          <p className="mb-4 rounded-2xl bg-destructive/10 text-destructive text-sm px-4 py-3">
            Não foi possível carregar os dados do painel.
          </p>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              title={k.hint}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl bg-card border border-border p-5 shadow-soft"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl gradient-primary grid place-items-center text-primary-foreground">
                  <k.icon className="h-5 w-5" />
                </div>
                {k.trend && (
                  <span className={`text-xs font-semibold ${k.trendNegativo ? "text-destructive" : "text-success"}`}>
                    {k.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-extrabold">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-5 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-3xl bg-card border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Crescimento da comunidade</h3>
              <span className="text-xs text-muted-foreground">Últimos 12 meses</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={resumo?.crescimento ?? []}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary-glow)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary-glow)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="users" name="Novos usuários" stroke="var(--color-primary)" fill="url(#g1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="posts" name="Boas ações" stroke="var(--color-primary-glow)" fill="url(#g2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-bold mb-4">Boas ações por dia</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={resumo?.boasAcoesSemana ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="deeds" name="Boas ações" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="mt-5 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-3xl bg-card border border-border p-5 shadow-soft overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Usuários em destaque</h3>
              <button
                type="button"
                onClick={() => setVerTodos(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-2 py-2 font-medium">Usuário</th>
                    <th className="px-2 py-2 font-medium">Boas ações</th>
                    <th className="px-2 py-2 font-medium">Tipo</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={4} className="px-2 py-6 text-center text-xs text-muted-foreground">
                        Carregando usuários...
                      </td>
                    </tr>
                  )}

                  {!isLoading && resumo?.destaques.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-6 text-center text-xs text-muted-foreground">
                        Ainda não há usuários.
                      </td>
                    </tr>
                  )}

                  {resumo?.destaques.map((u) => (
                    <tr key={u.email} className="border-t border-border hover:bg-accent/40 transition-colors">
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <PerfilUsuarioLink email={u.email} className="shrink-0 hover:opacity-80 transition-opacity">
                            <AvatarUsuario url={u.url_foto} nome={u.username} />
                          </PerfilUsuarioLink>
                          <div className="min-w-0">
                            <PerfilUsuarioLink email={u.email} className="block font-semibold truncate hover:underline">
                              {u.username}
                            </PerfilUsuarioLink>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 font-semibold">{u.totalPostagens}</td>
                      <td className="px-2 py-3">
                        <TipoUsuarioBadge tipo={u.tipo_usuario} />
                      </td>
                      <td className="px-2 py-3">
                        <AcoesUsuarioAdmin usuario={u} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Moderação pendente</h3>
              {(painelDenuncias?.total ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setVerDenuncias(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ver mais
                </button>
              )}
            </div>

            <div className="space-y-3">
              {carregandoDenuncias && (
                <p className="py-6 text-center text-xs text-muted-foreground">Carregando denúncias...</p>
              )}

              {!carregandoDenuncias && painelDenuncias?.denuncias.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Nenhuma denúncia pendente.</p>
              )}

              {painelDenuncias?.denuncias.map((d) => (
                <ItemDenuncia key={d.id} d={d} />
              ))}
            </div>
          </div>
        </div>

        <UsuariosAdminModal aberto={verTodos} onFechar={() => setVerTodos(false)} />
        <DenunciasAdminModal aberto={verDenuncias} onFechar={() => setVerDenuncias(false)} />
      </main>
      <MobileNav />
    </div>
  );
}