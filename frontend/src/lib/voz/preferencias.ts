const CHAVE = "gv-voz";
export const VEL_MIN = 0.7;
export const VEL_MAX = 1.5;

export interface PrefsVoz {
    respondido: boolean;
    ativo: boolean;
    velocidade: number;
}

export const PREFS_PADRAO: PrefsVoz = { respondido: false, ativo: false, velocidade: 1 };

const limitar = (v: number) => Math.min(VEL_MAX, Math.max(VEL_MIN, Number.isFinite(v) ? v : 1));

export function lerPrefs(): PrefsVoz {
    try {
        const j = JSON.parse(localStorage.getItem(CHAVE) ?? "null");
        if (!j || typeof j !== "object") return PREFS_PADRAO;
        return { respondido: j.respondido === true, ativo: j.ativo === true, velocidade: limitar(Number(j.velocidade)) };
    } catch {
        return PREFS_PADRAO;
    }
}

export function salvarPrefs(p: PrefsVoz) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify({ ...p, velocidade: limitar(p.velocidade) }));
    } catch {
        /* armazenamento indisponível */
    }
}