import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Logo({ to = "/", size = "md" }: { to?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { wrap: "h-8 w-8", text: "text-lg" },
    md: { wrap: "h-10 w-10", text: "text-xl" },
    lg: { wrap: "h-14 w-14", text: "text-3xl" },
  }[size];
  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <div className={`${sizes.wrap} rounded-2xl gradient-primary grid place-items-center shadow-glow transition-transform group-hover:scale-105`}>
        <Sparkles className="h-1/2 w-1/2 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className={`${sizes.text} font-bold tracking-tight`}>
        Good<span className="gradient-text">Vib</span><span className="text-primary">&</span>
      </span>
    </Link>
  );
}
