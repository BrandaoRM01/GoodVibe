import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useState } from "react";
import { AuthLayout, Field } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — GoodVib&" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [avatar, setAvatar] = useState<string | null>(null);
  return (
    <AuthLayout
      title="Faça parte da boa vibração 🌸"
      subtitle="Crie sua conta e comece sua jornada de boas ações hoje mesmo."
      footer={<>Já tem conta? <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link></>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group">
            <div className="h-20 w-20 rounded-full gradient-primary grid place-items-center text-primary-foreground shadow-glow overflow-hidden">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7" />}
            </div>
            <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 grid place-items-center text-white text-xs transition-opacity">
              Trocar
            </span>
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAvatar(URL.createObjectURL(f));
              }}
            />
          </label>
          <div>
            <p className="font-semibold text-sm">Foto de perfil</p>
            <p className="text-xs text-muted-foreground">PNG ou JPG, até 4MB</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome" icon={<User className="h-4 w-4" />} placeholder="Seu nome" />
          <Field label="Usuário" icon={<User className="h-4 w-4" />} placeholder="@usuario" />
        </div>
        <Field label="E-mail" icon={<Mail className="h-4 w-4" />} type="email" placeholder="voce@email.com" />
        <Field label="Senha" icon={<Lock className="h-4 w-4" />} type="password" placeholder="Mínimo 8 caracteres" />

        <p className="text-xs text-muted-foreground">
          Ao criar sua conta, você concorda com os <a href="#" className="text-primary font-semibold hover:underline">Termos</a> e o nosso compromisso com a gentileza.
        </p>

        <Link to="/feed" className="w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow hover:scale-[1.02] transition-transform">
          Criar minha conta <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AuthLayout>
  );
}
