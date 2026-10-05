import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiListarComentarios,
  apiListarRespostas,
  apiCriarComentario,
  apiEditarComentario,
  apiExcluirComentario,
  apiCurtirComentario,
  apiDescurtirComentario,
  type PaginaComentarios,
  type CriarComentarioPayload,
} from "./comentarios";

export function useComentarios(postagemId: number, enabled = true) {
  return useInfiniteQuery<PaginaComentarios>({
    queryKey: ["comentarios", postagemId, "raiz"],
    queryFn: ({ pageParam }) => apiListarComentarios(postagemId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (ultima) => ultima.proximoOffset ?? undefined,
    enabled,
  });
}

export function useRespostas(postagemId: number, comentarioId: number, enabled: boolean) {
  return useInfiniteQuery<PaginaComentarios>({
    queryKey: ["comentarios", postagemId, "respostas", comentarioId],
    queryFn: ({ pageParam }) => apiListarRespostas(comentarioId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (ultima) => ultima.proximoOffset ?? undefined,
    enabled,
  });
}

function useInvalidarComentarios(postagemId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["comentarios", postagemId] });
  };
}

export function useCriarComentario(postagemId: number) {
  const queryClient = useQueryClient();
  const invalidar = useInvalidarComentarios(postagemId);
  return useMutation({
    mutationFn: (payload: CriarComentarioPayload) => apiCriarComentario(payload),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useEditarComentario(postagemId: number) {
  const invalidar = useInvalidarComentarios(postagemId);
  return useMutation({
    mutationFn: ({ id, conteudo }: { id: number; conteudo: string }) => apiEditarComentario(id, conteudo),
    onSuccess: invalidar,
  });
}

export function useExcluirComentario(postagemId: number) {
  const queryClient = useQueryClient();
  const invalidar = useInvalidarComentarios(postagemId);
  return useMutation({
    mutationFn: (id: number) => apiExcluirComentario(id),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useCurtirComentario(postagemId: number) {
  const invalidar = useInvalidarComentarios(postagemId);
  return useMutation({
    mutationFn: ({ id, curtir }: { id: number; curtir: boolean }) =>
      curtir ? apiCurtirComentario(id) : apiDescurtirComentario(id),
    onSettled: invalidar,
  });
}
