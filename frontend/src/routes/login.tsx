import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useLogin } from "@/lib/use-auth";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — GoodVib&" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();
  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    login.mutate(
      { email, senha },
      {
        onSuccess: (usuario) => {
          toast.success(`Bem vindo, ${usuario.username}!`);
          navigate({ to: "/feed" });
        },
        onError: (err) => {
          const msg =
            err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.";
          toast.error(msg);
        },
      },
    );
  }

  return (
    <AuthLayout
      title="Bem-vindo de volta ✨"
      subtitle="Que bom te ver. Entre para continuar espalhando boas vibrações."
      footer={
        <>
          Não tem conta?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="E-mail"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Senha"
          icon={<Lock className="h-4 w-4" />}
          type={showPwd ? "text" : "password"}
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="accent-[var(--color-primary)]" />
            Lembrar de mim
          </label>
          <a href="#" className="text-primary font-semibold hover:underline">
            Esqueci a senha
          </a>
        </div>
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
        >
          {login.isPending ? "Entrando..." : "Entrar"} <ArrowRight className="h-4 w-4" />
        </button>
        <Divider />
        <SocialButtons />
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual side */}
      <div className="hidden lg:flex relative overflow-hidden gradient-primary text-primary-foreground p-12 flex-col justify-between">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <Logo />
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight max-w-md">
            "Aqui me sinto livre pra ser gentil sem medo."
          </h2>
          <p className="mt-4 opacity-90">— Marina, membro desde 2024</p>
        </div>
        <div className="relative grid grid-cols-3 gap-3 max-w-sm">
          {["120k+ membros", "2.3M boas ações", "98% acolhidos"].map((t) => (
            <div
              key={t}
              className="rounded-2xl bg-white/15 backdrop-blur p-3 text-xs font-semibold text-center"
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-muted-foreground text-center">{footer}</p>
        </motion.div>
      </div>
    </div>
  );
}

export function Field({
  label,
  icon,
  rightIcon,
  ...props
}: {
  label: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1.5 relative flex items-center">
        {icon && <span className="absolute left-4 text-muted-foreground">{icon}</span>}
        <input
          {...props}
          className={`w-full bg-card border border-border rounded-2xl py-3.5 ${icon ? "pl-11" : "pl-4"} ${rightIcon ? "pr-11" : "pr-4"} text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition`}
        />
        {rightIcon && <span className="absolute right-4">{rightIcon}</span>}
      </div>
    </label>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px bg-border flex-1" /> ou continue com{" "}
      <div className="h-px bg-border flex-1" />
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        className="bg-card border border-border rounded-2xl py-3 text-sm font-semibold hover:bg-accent transition-colors"
      >
        Google
      </button>
      <button
        type="button"
        className="bg-card border border-border rounded-2xl py-3 text-sm font-semibold hover:bg-accent transition-colors"
      >
        Apple
      </button>
    </div>
  );
}
