import { useSyncExternalStore } from "react";

export type EstadoFala = "parado" | "falando" | "pausado";
export interface SnapFala {
    estado: EstadoFala;
    semVozPt: boolean;
    erro: string | null;
}

const LANG = "pt-BR";
const INICIAL: SnapFala = { estado: "parado", semVozPt: false, erro: null };

let snap = INICIAL;
const ouvintes = new Set<() => void>();
let token = 0;
let timer: number | undefined;
let atual: SpeechSynthesisUtterance | null = null; // evita coleta de lixo do utterance (bug do Chrome)
let ultimoTexto = "";
let ultima = { texto: "", t: 0 };
let fimFala = 0;

function atualizar(p: Partial<SnapFala>) {
    snap = { ...snap, ...p };
    ouvintes.forEach((f) => f());
}

export const falaSuportada = () =>
    typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

// Prefere vozes LOCAIS (não enviam o texto a servidores) e pt-BR; cai para qualquer pt-*.
function escolherVoz(): SpeechSynthesisVoice | null {
    const vozes = window.speechSynthesis.getVoices();
    const lang = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
    const br = vozes.filter((v) => lang(v) === "pt-br");
    const lista = br.length ? br : vozes.filter((v) => lang(v).startsWith("pt"));
    return lista.find((v) => v.localService) ?? lista[0] ?? null;
}

// Frases curtas evitam o corte de falas longas em alguns navegadores
function dividir(texto: string): string[] {
    const saida: string[] = [];
    for (const trecho of texto.match(/[^.!?;:\n]+[.!?;:]*\s*/g) ?? [texto]) {
        let r = trecho.trim();
        while (r.length > 220) {
            let i = r.lastIndexOf(" ", 220);
            if (i < 80) i = 220;
            saida.push(r.slice(0, i));
            r = r.slice(i).trim();
        }
        if (r) saida.push(r);
    }
    return saida;
}

export function falar(
    texto: string,
    velocidade: number,
    opcoes?: { repetir?: boolean; aoTerminar?: () => void },
) {
    if (!falaSuportada()) {
        atualizar({ erro: "Seu navegador não oferece leitura por voz." });
        return;
    }
    const t = texto.trim();
    if (!t) return;
    const agora = Date.now();
    if (!opcoes?.repetir && t === ultima.texto && agora - ultima.t < 600) return; // anti-duplicidade
    ultima = { texto: t, t: agora };
    ultimoTexto = t;

    const meu = ++token;
    const sintese = window.speechSynthesis;
    window.clearTimeout(timer);
    sintese.cancel(); // nunca acumula fila

    const voz = escolherVoz();
    atualizar({ estado: "falando", erro: null, semVozPt: !voz });

    const partes = dividir(t);
    let i = 0;
    const proxima = () => {
        if (meu !== token) return;
        if (i >= partes.length) {
            atual = null;
            fimFala = Date.now();
            atualizar({ estado: "parado" });
            opcoes?.aoTerminar?.(); // só chega aqui se a fala terminou sem ser interrompida
            return;
        }
        const u = new SpeechSynthesisUtterance(partes[i++]);
        u.lang = voz?.lang ?? LANG;
        if (voz) u.voice = voz;
        u.rate = velocidade;
        u.onend = proxima;
        u.onerror = (e) => {
            if (meu !== token || e.error === "canceled" || e.error === "interrupted") return;
            atual = null;
            atualizar({ estado: "parado", erro: "Não foi possível reproduzir a voz neste dispositivo." });
        };
        atual = u;
        sintese.speak(u);
    };
    timer = window.setTimeout(proxima, 50); // dá tempo ao cancel() no Chrome
}

export function parar() {
    token++;
    window.clearTimeout(timer);
    atual = null;
    if (falaSuportada()) window.speechSynthesis.cancel();
    if (snap.estado !== "parado") {
        fimFala = Date.now();
        atualizar({ estado: "parado" });
    }
}

export function pausar() {
    if (!falaSuportada() || snap.estado !== "falando") return;
    window.speechSynthesis.pause();
    atualizar({ estado: "pausado" });
}

export function retomar() {
    if (!falaSuportada() || snap.estado !== "pausado") return;
    window.speechSynthesis.resume();
    atualizar({ estado: "falando" });
}

export function repetir(velocidade: number) {
    if (ultimoTexto) falar(ultimoTexto, velocidade, { repetir: true });
}

/** true se está falando ou terminou há menos de `margemMs` (evita o microfone captar a própria voz) */
export function estaFalando(margemMs = 0) {
    return snap.estado !== "parado" || Date.now() - fimFala < margemMs;
}

/** Aquece a lista de vozes (carrega assíncrona) e devolve a limpeza */
export function prepararVozes(): () => void {
    if (falaSuportada()) window.speechSynthesis.getVoices();
    return () => parar();
}

export function useFala(): SnapFala {
    return useSyncExternalStore(
        (cb) => {
            ouvintes.add(cb);
            return () => {
                ouvintes.delete(cb);
            };
        },
        () => snap,
        () => INICIAL,
    );
}