import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { ProfileView, mapPostagemParaPost } from "@/components/ProfileView";
import { useFeed } from "@/lib/use-postagens";
import { Settings, PlusCircle, MoreVertical, KeyRound, LogOut, Trash2, Eye, EyeOff } from "lucide-react";
import { useUsuarioAtual, useApagarPerfil, useLogout, useAlterarSenha } from "@/lib/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { EditProfile } from "@/components/EditProfile";
import { API_URL, ApiError } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/")({
  head: () => ({ meta: [{ title: "Perfil — GoodVib&" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: usuario, isLoading: carregandoUsuario } = useUsuarioAtual();
  const { data: postagensAPI, isLoading: carregandoFeed } = useFeed(undefined, usuario?.username, {
    enabled: !!usuario?.username,
  });
  const [abaAtiva, setAbaAtiva] = useState<"postagens" | "tweets">("postagens");

  const postagens = (postagensAPI ?? []).filter((p) => !!p.image).map(mapPostagemParaPost);
  const tweets = (postagensAPI ?? []).filter((p) => !p.image).map(mapPostagemParaPost);

  const [modalAberto, setModalAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const apagarPerfil = useApagarPerfil();

  async function handleExcluirPerfil() {
    if (!usuario) return;
    try {
      await apagarPerfil.mutateAsync(usuario.email);
      toast.success("Perfil excluído com sucesso.");
      navigate({ to: "/login" });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Não foi possível excluir o perfil.";
      toast.error(msg);
      setConfirmandoExclusao(false);
    }
  }

  const logout = useLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    toast.success("Você saiu da sua conta com sucesso.");
    navigate({ to: "/login" });
  }

  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenhaNova, setConfirmarSenhaNova] = useState("");
  const alterarSenha = useAlterarSenha();
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarSenhaNova, setMostrarSenhaNova] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  function fecharModalSenha() {
    setModalSenhaAberto(false);
    setSenhaAtual("");
    setSenhaNova("");
    setConfirmarSenhaNova("");
    setMostrarSenhaAtual(false);
    setMostrarSenhaNova(false);
    setMostrarConfirmarSenha(false);
  }

  async function handleAlterarSenha() {
    try {
      await alterarSenha.mutateAsync({ senhaAtual, senhaNova, confirmarSenhaNova });
      toast.success("Senha alterada com sucesso!");
      fecharModalSenha();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Não foi possível alterar a senha.";
      toast.error(msg);
    }
  }

  if (carregandoUsuario) {
    return (
      <div className="min-h-screen flex">
        <AppSidebar />
        <main className="flex-1 grid place-items-center text-muted-foreground">Carregando perfil...</main>
        <MobileNav />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex">
        <AppSidebar />
        <main className="flex-1 grid place-items-center text-muted-foreground">Faça login para ver seu perfil.</main>
        <MobileNav />
      </div>
    );
  }

  const inicial = usuario.username?.[0]?.toUpperCase() ?? "?";

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
            <>
              <button
                onClick={() => navigate({ to: "/feed", search: { compose: true } })}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity text-sm shadow-glow"
              >
                <PlusCircle className="h-4 w-4" /> Compartilhar boa ação
              </button>
              <button
                onClick={() => setModalAberto(true)}
                className="inline-flex items-center gap-2 bg-card border border-border font-semibold px-5 py-2.5 rounded-full hover:bg-accent transition-colors text-sm"
              >
                <Settings className="h-4 w-4" /> Editar perfil
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuAberto((v) => !v)}
                  className="h-10 w-10 rounded-full border border-border bg-card hover:bg-accent grid place-items-center transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {menuAberto && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-soft overflow-hidden z-20">
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          setModalSenhaAberto(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-accent transition-colors text-left"
                      >
                        <KeyRound className="h-4 w-4" /> Alterar senha
                      </button>
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-accent transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" /> Sair
                      </button>
                      <div className="h-px bg-border" />
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          setConfirmandoExclusao(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <Trash2 className="h-4 w-4" /> Excluir perfil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          }
        />
      </main>

      <EditProfile usuario={usuario} aberto={modalAberto} onClose={() => setModalAberto(false)} />

      <AnimatePresence>
        {confirmandoExclusao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-md px-4"
            onClick={() => !apagarPerfil.isPending && setConfirmandoExclusao(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-card border border-destructive/30 p-6 shadow-glow"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="h-11 w-11 rounded-2xl bg-destructive/10 grid place-items-center shrink-0">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Excluir perfil</h2>
                  <p className="text-xs text-muted-foreground">Essa ação não pode ser desfeita</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2.5 leading-relaxed">
                Todas as suas postagens, dados e interações serão apagados permanentemente. Você não vai conseguir recuperar sua conta depois disso.
              </p>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-primary-foreground text-sm font-bold shrink-0 overflow-hidden">
                  {usuario.url_foto ? (
                    <img src={`${API_URL}/${usuario.url_foto}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    inicial
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{usuario.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmandoExclusao(false)}
                  disabled={apagarPerfil.isPending}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-card border border-border hover:bg-accent transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluirPerfil}
                  disabled={apagarPerfil.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Trash2 className="h-4 w-4" />
                  {apagarPerfil.isPending ? "Excluindo..." : "Sim, excluir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalSenhaAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-md px-4"
            onClick={fecharModalSenha}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-glow"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="h-11 w-11 rounded-2xl gradient-primary grid place-items-center shrink-0 shadow-soft">
                  <KeyRound className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Alterar senha</h2>
                  <p className="text-xs text-muted-foreground">Mantenha sua conta segura</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground bg-accent/60 rounded-xl px-3 py-2.5 leading-relaxed">
                A nova senha precisa ter pelo menos 8 caracteres e não pode ser igual a nenhuma das suas últimas 5 senhas.
              </p>

              <div className="mt-4 space-y-3">
                <CampoSenha
                  label="Senha atual"
                  value={senhaAtual}
                  onChange={setSenhaAtual}
                  mostrar={mostrarSenhaAtual}
                  onToggleMostrar={() => setMostrarSenhaAtual((v) => !v)}
                  disabled={alterarSenha.isPending}
                />
                <CampoSenha
                  label="Nova senha"
                  value={senhaNova}
                  onChange={setSenhaNova}
                  mostrar={mostrarSenhaNova}
                  onToggleMostrar={() => setMostrarSenhaNova((v) => !v)}
                  disabled={alterarSenha.isPending}
                />
                {senhaNova.length > 0 && <ForcaSenha senha={senhaNova} />}
                <CampoSenha
                  label="Confirmar nova senha"
                  value={confirmarSenhaNova}
                  onChange={setConfirmarSenhaNova}
                  mostrar={mostrarConfirmarSenha}
                  onToggleMostrar={() => setMostrarConfirmarSenha((v) => !v)}
                  disabled={alterarSenha.isPending}
                  erro={
                    confirmarSenhaNova.length > 0 && confirmarSenhaNova !== senhaNova
                      ? "As senhas não coincidem"
                      : undefined
                  }
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={fecharModalSenha}
                  disabled={alterarSenha.isPending}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-card border border-border hover:bg-accent transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAlterarSenha}
                  disabled={
                    alterarSenha.isPending ||
                    !senhaAtual ||
                    !senhaNova ||
                    !confirmarSenhaNova ||
                    senhaNova !== confirmarSenhaNova
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold gradient-primary text-primary-foreground shadow-soft hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {alterarSenha.isPending ? "Salvando..." : "Salvar senha"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}

function CampoSenha({
  label,
  value,
  onChange,
  mostrar,
  onToggleMostrar,
  disabled,
  erro,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mostrar: boolean;
  onToggleMostrar: () => void;
  disabled?: boolean;
  erro?: string;
}) {
  return (
    <div>
      <div className="relative">
        <input
          type={mostrar ? "text" : "password"}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full rounded-xl border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors disabled:opacity-60 ${erro ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
            }`}
        />
        <button
          type="button"
          onClick={onToggleMostrar}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
    </div>
  );
}

function ForcaSenha({ senha }: { senha: string }) {
  const criterios = [senha.length >= 8, /[A-Z]/.test(senha), /[0-9]/.test(senha), /[^A-Za-z0-9]/.test(senha)];
  const pontuacao = criterios.filter(Boolean).length;

  const cor =
    pontuacao <= 1 ? "bg-destructive" : pontuacao <= 2 ? "bg-amber-500" : pontuacao <= 3 ? "bg-lime-500" : "bg-emerald-500";
  const texto = pontuacao <= 1 ? "Fraca" : pontuacao <= 2 ? "Razoável" : pontuacao <= 3 ? "Boa" : "Forte";

  return (
    <div className="-mt-1 flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`flex-1 rounded-full transition-colors ${i < pontuacao ? cor : "bg-transparent"}`} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">{texto}</span>
    </div>
  );
}