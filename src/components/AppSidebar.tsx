import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Compass, MessageCircle, Bell, User, Settings, Sparkles, Heart, ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { to: "/feed", label: "Início", icon: Home },
  { to: "/feed", label: "Explorar", icon: Compass },
  { to: "/messages", label: "Mensagens", icon: MessageCircle },
  { to: "/feed", label: "Notificações", icon: Bell },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/admin", label: "Painel", icon: ShieldCheck },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-20 lg:w-64 shrink-0 flex-col gap-2 border-r border-border bg-sidebar/60 backdrop-blur-xl px-3 lg:px-4 py-6">
      <Link to="/feed" className="flex items-center gap-2.5 px-2 mb-4 justify-center lg:justify-start">
        <div className="h-10 w-10 rounded-2xl gradient-primary grid place-items-center shadow-glow shrink-0">
          <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="hidden lg:inline text-xl font-bold tracking-tight">
          Good<span className="gradient-text">Vib</span><span className="text-primary">&</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((it, i) => {
          const active = path === it.to && i === 0 ? true : path.startsWith(it.to) && it.to !== "/feed";
          const isActive = path === it.to;
          return (
            <Link
              key={it.label + i}
              to={it.to}
              title={it.label}
              className={`group relative flex items-center gap-3 px-3 lg:px-4 py-3 rounded-2xl transition-all justify-center lg:justify-start ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-primary/10 -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <it.icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline text-sm">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl p-5 gradient-primary text-primary-foreground shadow-glow">
        <Heart className="h-5 w-5 mb-2" />
        <p className="text-sm font-semibold leading-snug mb-3">
          Espalhe boas vibrações hoje
        </p>
        <button className="w-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium rounded-full py-2">
          Compartilhar boa ação
        </button>
      </div>
    </aside>
  );
}
