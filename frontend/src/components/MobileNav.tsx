import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageCircle, User, ShieldCheck, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { useUsuarioAtual } from "@/lib/use-auth";
import { ehAdmin } from "@/components/RotaProtegida";

const items = [
  { to: "/feed", label: "Início", icon: Home },
  { to: "/feed", label: "Explorar", icon: Compass },
  { to: "/messages", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/admin", label: "Painel", icon: ShieldCheck, somenteAdmin: true },
];

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: usuario } = useUsuarioAtual();
  const itensVisiveis = items.filter((it) => !it.somenteAdmin || ehAdmin(usuario));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <ul className="flex items-center justify-around">
        {itensVisiveis.map((it, i) => {
          const isActive = path === it.to && i === 0 ? path === "/feed" : path === it.to;
          return (
            <li key={it.label + i}>
              <Link
                to={it.to}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <it.icon className="h-5 w-5 relative" />
                <span className="text-[10px] font-semibold relative">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
