import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, Field } from "./login";
import { ApiError } from "@/lib/api";
import { apiRedefinirSenha } from "@/lib/recuperar-senha";

interface RedefinirSenhaSearch {
    token?: string;
}

export const Route = createFileRoute("/redefinir-senha")({
    head: () => ({ meta: [{ title: "Redefinir senha — GoodVib&" }] }),
    validateSearch: (search: Record<string, unknown>): RedefinirSenhaSearch => ({
        token: typeof search.token === "string" && search.token ? search.token : undefined,
    }),
    component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
    const { token } = Route.useSearch();
    const navigate = useNavigate();
    const [senhaNova, setSenhaNova] = useState("");
    const [confirmarSenhaNova, setConfirmarSenhaNova] = useState("");
    const [showPwd, setShowPwd] = useState(false);

    const redefinir = useMutation({
        mutationFn: (params: { token: string; senhaNova: string; confirmarSenhaNova: string }) =>
            apiRedefinirSenha(params),
        onSuccess: (mensagem) => {
            toast.success(mensagem);
            navigate({ to: "/login", replace: true });
        },
        onError: (err) => {
            const msg =
                err instanceof ApiError ? err.message : "Não foi possível redefinir a senha. Tente novamente.";
            toast.error(msg);
        },
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return;

        if (senhaNova !== confirmarSenhaNova) {
            toast.error("As senhas não coincidem.");
            return;
        }

        redefinir.mutate({ token, senhaNova, confirmarSenhaNova });
    }

    const rodape = (
        <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
        </Link>
    );

    if (!token) {
        return (
            <AuthLayout
                title="Link inválido"
                subtitle="Este endereço de recuperação está incompleto. Peça um novo link para continuar."
                footer={rodape}
            >
                <Link
                    to="/esqueci-senha"
                    className="w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow hover:scale-[1.02] transition-transform"
                >
                    Pedir novo link <ArrowRight className="h-4 w-4" />
                </Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Crie uma nova senha 🔒"
            subtitle="Escolha uma senha com pelo menos 8 caracteres que você ainda não tenha usado."
            footer={rodape}
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <Field
                    label="Nova senha"
                    icon={<Lock className="h-4 w-4" />}
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                    label="Confirmar nova senha"
                    icon={<Lock className="h-4 w-4" />}
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmarSenhaNova}
                    onChange={(e) => setConfirmarSenhaNova(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
                <button
                    type="submit"
                    disabled={redefinir.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
                >
                    {redefinir.isPending ? "Salvando..." : "Redefinir senha"} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AuthLayout>
    );
}