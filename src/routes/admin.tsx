import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Users, Heart, Flag, TrendingUp, MoreHorizontal, Search, ShieldCheck, Trash2, Check } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel administrativo — GoodVib&" }] }),
  component: AdminPage,
});

const areaData = Array.from({ length: 12 }, (_, i) => ({
  name: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i],
  users: 1200 + i * 800 + Math.round(Math.random() * 400),
  posts: 800 + i * 600 + Math.round(Math.random() * 300),
}));

const barData = ["Seg","Ter","Qua","Qui","Sex","Sab","Dom"].map((d) => ({
  day: d, deeds: 200 + Math.round(Math.random() * 400),
}));

const users = [
  { name: "Marina Costa", handle: "@marina", level: 9, deeds: 234, status: "Ativo" },
  { name: "Lucas Andrade", handle: "@lucas.a", level: 7, deeds: 142, status: "Ativo" },
  { name: "Sofia Oliveira", handle: "@sofiaoli", level: 8, deeds: 189, status: "Ativo" },
  { name: "Rafael Mendes", handle: "@rafa.m", level: 5, deeds: 78, status: "Pendente" },
  { name: "Ana Beatriz", handle: "@anab", level: 6, deeds: 102, status: "Ativo" },
];

const reports = [
  { user: "@spam_user", reason: "Conteúdo repetitivo", time: "5min" },
  { user: "@negative_x", reason: "Comentário desrespeitoso", time: "2h" },
  { user: "@unknown", reason: "Possível bot", time: "ontem" },
];

function AdminPage() {
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
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar..." className="bg-card border border-border rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40 w-64" />
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Usuários ativos", value: "12.4k", trend: "+8.2%", icon: Users },
            { label: "Boas ações hoje", value: "2.318", trend: "+14%", icon: Heart },
            { label: "Engajamento", value: "78%", trend: "+3.1%", icon: TrendingUp },
            { label: "Denúncias abertas", value: "12", trend: "-22%", icon: Flag },
          ].map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl bg-card border border-border p-5 shadow-soft"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl gradient-primary grid place-items-center text-primary-foreground">
                  <k.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-success">{k.trend}</span>
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
                <AreaChart data={areaData}>
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
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="users" stroke="var(--color-primary)" fill="url(#g1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="posts" stroke="var(--color-primary-glow)" fill="url(#g2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-bold mb-4">Boas ações por dia</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Bar dataKey="deeds" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
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
              <button className="text-xs font-semibold text-primary hover:underline">Ver todos</button>
            </div>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-2 py-2 font-medium">Usuário</th>
                    <th className="px-2 py-2 font-medium">Nível</th>
                    <th className="px-2 py-2 font-medium">Boas ações</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.handle} className="border-t border-border hover:bg-accent/40 transition-colors">
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-xs">{u.name[0]}</div>
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.handle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 font-semibold">Nv. {u.level}</td>
                      <td className="px-2 py-3">{u.deeds}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-1 rounded-full ${u.status === "Ativo" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-accent">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-bold mb-4">Moderação pendente</h3>
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.user} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40">
                  <Flag className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{r.user}</p>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.time}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button className="h-7 w-7 rounded-full bg-success/15 text-success grid place-items-center hover:bg-success/25"><Check className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 rounded-full bg-destructive/15 text-destructive grid place-items-center hover:bg-destructive/25"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
