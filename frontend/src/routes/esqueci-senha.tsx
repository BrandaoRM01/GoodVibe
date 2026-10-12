import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, Field } from "./login";
import { ApiError } from "@/lib/api";
import { apiEsqueciSenha } from "@/lib/recuperar-senha";

export const Route = createFileRoute("/esqueci-senha")({
    head: () => ({ meta: [{ title: "Recuperar senha — GoodVib&" }] }),
    component: EsqueciSenhaPage,
});

function EsqueciSenhaPage() {
    const [email, setEmail] = useState("");
    const [mensagemEnviada, setMensagemEnviada] = useState<string | null>(null);

    const enviar = useMutation({
        mutationFn: (emailInformado: string) => apiEsqueciSenha(emailInformado),
        onSuccess: (mensagem) => setMensagemEnviada(mensagem),
        onError: (err) => {
            const msg =
                err instanceof ApiError ? err.message : "Não foi possível enviar o e-mail. Tente novamente.";
            toast.error(msg);
        },
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        enviar.mutate(email.trim());
    }

    return (
        <AuthLayout
            title="Esqueceu a senha? 🔑"
            subtitle="Sem problema. Informe seu e-mail e enviaremos um link para você criar uma nova senha."
            footer={
                <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                </Link>
            }
        >
            {mensagemEnviada ? (
                <div className="space-y-4">
                    <div className="rounded-2xl bg-primary/10 p-4 text-sm leading-relaxed">
                        {mensagemEnviada}
                    </div>
                    <button
                        type="button"
                        onClick={() => setMensagemEnviada(null)}
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        Usar outro e-mail
                    </button>
                </div>
            ) : (
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
                    <button
                        type="submit"
                        disabled={enviar.isPending}
                        className="w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
                    >
                        {enviar.isPending ? "Enviando..." : "Enviar link de recuperação"}{" "}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}