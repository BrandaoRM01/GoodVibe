import { useQuery } from "@tanstack/react-query";
import { apiEstatisticasPublicas, type EstatisticasPublicasAPI } from "./estatisticas";

export function useEstatisticasPublicas() {
    return useQuery<EstatisticasPublicasAPI>({
        queryKey: ["estatisticas-publicas"],
        queryFn: apiEstatisticasPublicas,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}