import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, getToken } from "./api";
import {
    apiAbrirConversa,
    apiEnviarMensagem,
    apiListarConversas,
    apiMarcarConversaLida,
    apiTotalNaoLidasMensagens,
    mesclarMensagens,
    novoClientId,
    type ConversaListaAPI,
    type MensagemAPI,
    type MensagemLocal,
    type UsuarioResumoAPI,
} from "./mensagens";
import { conectarTempoReal } from "./tempo-real";

export function useConversas() {
    return useQuery<ConversaListaAPI[]>({
        queryKey: ["mensagens", "conversas"],
        queryFn: apiListarConversas,
        enabled: !!getToken(),
        staleTime: 30 * 1000,
    });
}

export function useNaoLidasMensagens() {
    return useQuery<number>({
        queryKey: ["mensagens", "nao-lidas"],
        queryFn: apiTotalNaoLidasMensagens,
        enabled: !!getToken(),
        staleTime: 30 * 1000,
    });
}

// Atualiza horários relativos periodicamente
export function useAgora(intervaloMs = 30000) {
    const [agora, setAgora] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setAgora(new Date()), intervaloMs);
        return () => clearInterval(t);
    }, [intervaloMs]);
    return agora;
}

const POR_PAGINA = 30;

export function useConversa(email: string | undefined, meuEmail: string | undefined) {
    const queryClient = useQueryClient();
    const [carregando, setCarregando] = useState(!!email);
    const [erro, setErro] = useState<string | null>(null);
    const [usuario, setUsuario] = useState<UsuarioResumoAPI | null>(null);
    const [mensagens, setMensagens] = useState<MensagemLocal[]>([]);
    const [proximoAntes, setProximoAntes] = useState<number | null>(null);
    const [carregandoMais, setCarregandoMais] = useState(false);
    const [visivel, setVisivel] = useState(true);

    const versaoRef = useRef(0);
    const ultimoIdRef = useRef<number | null>(null);
    const marcandoRef = useRef(false);

    const minusculo = email?.toLowerCase();

    useEffect(() => {
        ultimoIdRef.current = mensagens.reduce<number | null>(
            (max, m) => (m.id !== null && (max === null || m.id > max) ? m.id : max),
            null
        );
    }, [mensagens]);

    const carregar = useCallback(async () => {
        if (!email) return;
        const versao = versaoRef.current;
        try {
            const dados = await apiAbrirConversa(email, { limite: POR_PAGINA });
            if (versao !== versaoRef.current) return;
            setUsuario(dados.usuario);
            setMensagens(mesclarMensagens([], dados.mensagens));
            setProximoAntes(dados.proximoAntes);
            setErro(null);
        } catch (e) {
            if (versao !== versaoRef.current) return;
            setErro(e instanceof ApiError ? e.message : "Não foi possível carregar a conversa.");
        } finally {
            if (versao === versaoRef.current) setCarregando(false);
        }
    }, [email]);

    // Busca só o que chegou depois da última mensagem conhecida (reconexão / mudança de relação)
    const recarregar = useCallback(async () => {
        if (!email) return;
        const versao = versaoRef.current;
        try {
            const ultimo = ultimoIdRef.current;
            const dados = await apiAbrirConversa(email, ultimo ? { depois: ultimo } : { limite: POR_PAGINA });
            if (versao !== versaoRef.current) return;
            setUsuario(dados.usuario);
            setMensagens((atual) => mesclarMensagens(atual, dados.mensagens));
        } catch {
            // silencioso: a próxima reconexão tenta de novo
        }
    }, [email]);

    useEffect(() => {
        versaoRef.current += 1;
        setCarregando(!!email);
        setErro(null);
        setUsuario(null);
        setMensagens([]);
        setProximoAntes(null);
        void carregar();
    }, [email, carregar]);

    useEffect(() => {
        if (!email) return;
        const socket = conectarTempoReal();
        if (!socket) return;

        const aoMensagem = (d: { mensagem: MensagemAPI; conversaCom: string }) => {
            if (d.conversaCom.toLowerCase() !== minusculo) return;
            setMensagens((atual) => mesclarMensagens(atual, [d.mensagem]));
        };
        const aoLidas = (d: { leitor: string }) => {
            if (d.leitor.toLowerCase() !== minusculo) return;
            setMensagens((atual) =>
                atual.map((m) => (m.remetenteEmail.toLowerCase() !== minusculo ? { ...m, lida: true } : m))
            );
        };
        const aoAtualizar = () => void recarregar();

        socket.on("mensagem:nova", aoMensagem);
        socket.on("mensagens:lidas", aoLidas);
        socket.on("conversas:atualizar", aoAtualizar);
        socket.io.on("reconnect", aoAtualizar);

        return () => {
            socket.off("mensagem:nova", aoMensagem);
            socket.off("mensagens:lidas", aoLidas);
            socket.off("conversas:atualizar", aoAtualizar);
            socket.io.off("reconnect", aoAtualizar);
        };
    }, [email, minusculo, recarregar]);

    useEffect(() => {
        const aoMudar = () => setVisivel(document.visibilityState === "visible");
        aoMudar();
        document.addEventListener("visibilitychange", aoMudar);
        return () => document.removeEventListener("visibilitychange", aoMudar);
    }, []);

    // Só marca como lida quando a conversa está de fato aberta e visível
    const temNaoLida = mensagens.some(
        (m) => m.id !== null && !m.lida && m.remetenteEmail.toLowerCase() === minusculo
    );

    useEffect(() => {
        if (!email || !temNaoLida || !visivel || marcandoRef.current) return;
        marcandoRef.current = true;

        apiMarcarConversaLida(email)
            .then(() => {
                setMensagens((atual) =>
                    atual.map((m) => (m.remetenteEmail.toLowerCase() === minusculo ? { ...m, lida: true } : m))
                );
                queryClient.invalidateQueries({ queryKey: ["mensagens"] });
                queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
            })
            .catch(() => {
                // tenta novamente na próxima mudança
            })
            .finally(() => {
                marcandoRef.current = false;
            });
    }, [email, minusculo, temNaoLida, visivel, queryClient]);

    const carregarMais = useCallback(async () => {
        if (!email || proximoAntes === null || carregandoMais) return;
        setCarregandoMais(true);
        try {
            const dados = await apiAbrirConversa(email, { antes: proximoAntes, limite: POR_PAGINA });
            setMensagens((atual) => mesclarMensagens(atual, dados.mensagens));
            setProximoAntes(dados.proximoAntes);
        } catch {
            // o botão continua disponível para tentar de novo
        } finally {
            setCarregandoMais(false);
        }
    }, [email, proximoAntes, carregandoMais]);

    // Reenviar usa o mesmo clientId, então o servidor nunca duplica a mensagem
    const enviar = useCallback(
        async (conteudo: string, clientIdExistente?: string) => {
            if (!email || !meuEmail) return;
            const clientId = clientIdExistente ?? novoClientId();

            setMensagens((atual) => {
                if (atual.some((m) => m.clientId === clientId)) {
                    return atual.map((m) =>
                        m.clientId === clientId ? { ...m, status: "enviando", erro: undefined } : m
                    );
                }
                return mesclarMensagens(atual, [
                    {
                        id: null,
                        conversaId: 0,
                        remetenteEmail: meuEmail,
                        tipo: "texto",
                        conteudo,
                        clientId,
                        lida: false,
                        criadoEm: new Date().toISOString(),
                        postagem: null,
                        status: "enviando",
                        local: Date.now(),
                    },
                ]);
            });

            try {
                const enviada = await apiEnviarMensagem(email, { conteudo, clientId });
                setMensagens((atual) => mesclarMensagens(atual, [enviada]));
            } catch (e) {
                const texto = e instanceof ApiError ? e.message : "Sem conexão. Tente novamente.";
                setMensagens((atual) =>
                    atual.map((m) => (m.clientId === clientId ? { ...m, status: "falhou", erro: texto } : m))
                );
                if (e instanceof ApiError && e.status === 403) {
                    queryClient.invalidateQueries({ queryKey: ["seguindo-ids"] });
                }
            }
        },
        [email, meuEmail, queryClient]
    );

    const descartar = useCallback((clientId: string) => {
        setMensagens((atual) => atual.filter((m) => m.clientId !== clientId));
    }, []);

    return {
        carregando,
        erro,
        usuario,
        mensagens,
        temMais: proximoAntes !== null,
        carregandoMais,
        carregarMais,
        enviar,
        descartar,
    };
}