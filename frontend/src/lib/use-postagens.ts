import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiListarFeed,
  apiBuscarPostagem,
  apiCriarPostagem,
  apiCurtirPostagem,
  apiDescurtirPostagem,
  apiExcluirPostagem,
  apiSugestoesTags,
  type PostagemAPI,
  type CriarPostagemPayload,
  type TagSugestaoAPI,
  apiTagsTendencias,
  TagTendenciaAPI,
  apiEditarPostagem,
  type EditarPostagemPayload,
} from "./postagens";

export function useSugestoesTags(termo: string) {
  return useQuery<TagSugestaoAPI[]>({
    queryKey: ["tags-sugestoes", termo],
    queryFn: () => apiSugestoesTags(termo),
    enabled: termo.trim().length >= 2, // só busca a partir de 2 caracteres
    staleTime: 30 * 1000,
  });
}

export function useFeed(tag?: string, autor?: string, options?: { enabled?: boolean }) {
  return useQuery<PostagemAPI[]>({
    queryKey: ["feed", tag ?? null, autor ?? null],
    queryFn: () => apiListarFeed(tag, autor),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function usePostagem(id: number) {
  return useQuery<PostagemAPI>({
    queryKey: ["postagem", id],
    queryFn: () => apiBuscarPostagem(id),
    enabled: !!id,
  });
}

export function useCriarPostagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarPostagemPayload) => apiCriarPostagem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useCurtirPostagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiCurtirPostagem(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const anterior = queryClient.getQueryData<PostagemAPI[]>(["feed"]);

      queryClient.setQueryData<PostagemAPI[]>(["feed"], (old) =>
        old?.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );

      return { anterior };
    },
    onError: (_err, _id, context) => {
      if (context?.anterior) {
        queryClient.setQueryData(["feed"], context.anterior);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDescurtirPostagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDescurtirPostagem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useExcluirPostagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiExcluirPostagem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useTagsTendencias() {
  return useQuery<TagTendenciaAPI[]>({
    queryKey: ["tags-tendencias"],
    queryFn: apiTagsTendencias,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEditarPostagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EditarPostagemPayload }) => apiEditarPostagem(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["postagem", variables.id] });
    },
  });
}