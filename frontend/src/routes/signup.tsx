import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, Field } from "./login";
import { useCadastro } from "@/lib/use-auth";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — GoodVib&" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const navigate = useNavigate();
  const cadastro = useCadastro();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    cadastro.mutate(
      { email, senha, confirmarSenha, username, foto: avatarFile },
      {
        onSuccess: () => {
          toast.success("Cadastro realizado com sucesso! Faça login para continuar.");
          navigate({ to: "/login" });
        },
        onError: (err) => {
          const msg =
            err instanceof ApiError
              ? err.message
              : "Não foi possível criar a conta. Tente novamente.";
          toast.error(msg);
        },
      },
    );
  }

  return (
    <AuthLayout
      title="Faça parte da boa vibração 🌸"
      subtitle="Crie sua conta e comece sua jornada de boas ações hoje mesmo."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group">
            <div className="h-20 w-20 rounded-full gradient-primary grid place-items-center text-primary-foreground shadow-glow overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-7 w-7" />
              )}
            </div>
            <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 grid place-items-center text-white text-xs transition-opacity">
              Trocar
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <div>
            <p className="font-semibold text-sm">Foto de perfil</p>
            <p className="text-xs text-muted-foreground">PNG ou JPG, até 4MB (opcional)</p>
          </div>
        </div>

        <Field
          label="Usuário"
          icon={<User className="h-4 w-4" />}
          placeholder="seu_usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
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
          placeholder="Mínimo 8 caracteres"
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
        <Field
          label="Confirmar senha"
          icon={<Lock className="h-4 w-4" />}
          type={showPwd ? "text" : "password"}
          placeholder="Repita a senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
        />

        <p className="text-xs text-muted-foreground">
          Ao criar sua conta, você concorda com os{" "}
          <a href="#" className="text-primary font-semibold hover:underline">
            Termos
          </a>{" "}
          e o nosso compromisso com a gentileza.
        </p>

        <button
          type="submit"
          disabled={cadastro.isPending}
          className="w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
        >
          {cadastro.isPending ? "Criando conta..." : "Criar minha conta"}{" "}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthLayout>
  );
}