import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { ProfileView, mapPostagemParaPost } from "@/components/ProfileView";
import { useFeed } from "@/lib/use-postagens";
import { useUsuarioAtual, useUsuarioPorEmail } from "@/lib/use-auth";
import { UserPlus } from "lucide-react";
import { RotaProtegida } from "@/components/RotaProtegida";

export const Route = createFileRoute("/profile/$email")({
    head: () => ({ meta: [{ title: "Perfil — GoodVib&" }] }),
    component: PerfilPublicoPage,
});

function PerfilPublicoPage() {
    return (
        <RotaProtegida>
            <PerfilPublicoConteudo />
        </RotaProtegida>
    );
}

function PerfilPublicoConteudo() {
    const { email } = Route.useParams();
    const navigate = useNavigate();

    const { data: usuarioAtual } = useUsuarioAtual();
    const ehMeuProprioPerfil = usuarioAtual?.email === email;

    useEffect(() => {
        if (ehMeuProprioPerfil) {
            navigate({ to: "/profile", replace: true });
        }
    }, [ehMeuProprioPerfil, navigate]);

    const { data: usuario, isLoading: carregandoUsuario, isError } = useUsuarioPorEmail(
        ehMeuProprioPerfil ? undefined : email
    );
    const { data: postagensAPI, isLoading: carregandoFeed } = useFeed(undefined, usuario?.username, {
        enabled: !!usuario?.username,
    });

    const [abaAtiva, setAbaAtiva] = useState<"postagens" | "tweets">("postagens");

    const postagens = (postagensAPI ?? []).filter((p) => !!p.image).map(mapPostagemParaPost);
    const tweets = (postagensAPI ?? []).filter((p) => !p.image).map(mapPostagemParaPost);

    if (carregandoUsuario || ehMeuProprioPerfil) {
        return (
            <div className="min-h-screen flex">
                <AppSidebar />
                <main className="flex-1 grid place-items-center text-muted-foreground">Carregando perfil...</main>
                <MobileNav />
            </div>
        );
    }

    if (isError || !usuario) {
        return (
            <div className="min-h-screen flex">
                <AppSidebar />
                <main className="flex-1 grid place-items-center text-muted-foreground">
                    Não foi possível encontrar esse perfil.
                </main>
                <MobileNav />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <AppSidebar />
            <main className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-6">
                <ProfileView
                    usuario={usuario}
                    postagens={postagens}
                    tweets={tweets}
                    carregandoFeed={carregandoFeed}
                    abaAtiva={abaAtiva}
                    onMudarAba={setAbaAtiva}
                    actions={
                        <button
                            disabled
                            title="Em breve"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm shadow-glow opacity-60 cursor-not-allowed"
                        >
                            <UserPlus className="h-4 w-4" /> Seguir
                        </button>
                    }
                />
            </main>
            <MobileNav />
        </div>
    );
}