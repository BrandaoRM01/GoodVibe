import { MoreHorizontal, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiError } from "@/lib/api";
import { useUsuarioAtual } from "@/lib/use-auth";
import { useAlterarPermissao, useExcluirUsuario } from "@/lib/use-admin";
import type { UsuarioRankingAPI } from "@/lib/admin";

function mensagemErro(err: unknown, padrao: string) {
  return err instanceof ApiError ? err.message : padrao;
}

export function AcoesUsuarioAdmin({ usuario }: { usuario: UsuarioRankingAPI }) {
  const { data: atual } = useUsuarioAtual();
  const alterarPermissao = useAlterarPermissao();
  const excluirUsuario = useExcluirUsuario();

  // Só quem gerencia usuários (superadmin) vê as ações
  if (!atual?.pode_gerenciar_usuarios) return null;

  const ehEu = atual.email === usuario.email;
  const ehSuperadmin = usuario.tipo_usuario === "superadmin";
  const podeAgir = !ehEu && !ehSuperadmin;
  const ocupado = alterarPermissao.isPending || excluirUsuario.isPending;

  function handleAlterarPermissao() {
    const aviso =
      usuario.tipo_usuario === "admin"
        ? `Remover a permissão de admin de ${usuario.username}? Ele voltará a ser User.`
        : `Tornar ${usuario.username} um admin?`;
    if (!window.confirm(aviso)) return;

    alterarPermissao.mutate(usuario.email, {
      onSuccess: (data) => toast.success(data.mensagem ?? "Permissão alterada com sucesso."),
      onError: (err) => toast.error(mensagemErro(err, "Não foi possível alterar a permissão.")),
    });
  }

  function handleExcluir() {
    const aviso = `Excluir o usuário ${usuario.username}? As postagens e os comentários dele também serão excluídos. Essa ação não pode ser desfeita.`;
    if (!window.confirm(aviso)) return;

    excluirUsuario.mutate(usuario.email, {
      onSuccess: (data) => toast.success(data.mensagem ?? "Usuário excluído com sucesso."),
      onError: (err) => toast.error(mensagemErro(err, "Não foi possível excluir o usuário.")),
    });
  }

  // Largura fixa para as colunas não mudarem de posição entre linhas com e sem ações
  return (
    <div className="flex items-center justify-end gap-1 shrink-0 w-[64px] sm:w-[120px]">
      {podeAgir && (
        <>
          <button
            type="button"
            onClick={handleAlterarPermissao}
            disabled={ocupado}
            aria-label={`Alterar permissão de ${usuario.username}`}
            title="Alterar permissão"
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">Permissão</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={ocupado}
                aria-label={`Mais ações para ${usuario.username}`}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-accent disabled:opacity-60"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={handleExcluir}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir usuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}