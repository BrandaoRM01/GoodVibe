import { io, type Socket } from "socket.io-client";
import { API_URL, getToken } from "@/lib/api";

let socket: Socket | null = null;
let tokenConectado: string | null = null;

export function conectarTempoReal(): Socket | null {
    if (typeof window === "undefined") return null;

    const token = getToken();
    if (!token) {
        desconectarTempoReal();
        return null;
    }

    if (socket && tokenConectado === token) return socket;

    socket?.disconnect();
    tokenConectado = token;
    socket = io(API_URL, {
        auth: (cb) => cb({ token: getToken() }),
        reconnectionDelayMax: 5000,
    });
    return socket;
}

export function desconectarTempoReal() {
    socket?.disconnect();
    socket = null;
    tokenConectado = null;
}