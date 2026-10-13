import { useEffect } from "react";

const VLIBRAS_ROOT = "https://vlibras.gov.br/app";

const AZUL_CLARO = /#3690fa/gi;
const AZUL_ESCURO = /#2266d2/gi;

declare global {
    interface Window {
        VLibras?: { Widget: new (rootPath: string, ...args: unknown[]) => unknown };
        VLibrasWidget?: { initBtn?: HTMLElement };
    }
}

/* ---------- Utilitários de cor ---------- */

function corParaHex(cor: string): string | null {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#010203";
    ctx.fillStyle = cor;
    if (ctx.fillStyle === "#010203") return null;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgbParaHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return { h: 0, s: 0, l };
    const s = d / (1 - Math.abs(2 * l - 1));
    let h: number;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    return { h, s, l };
}

function hslParaRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function corPrimaria(): string | null {
    const css = getComputedStyle(document.documentElement);
    return corParaHex(css.getPropertyValue("--primary").trim());
}

function matizDe(hex: string): number {
    return rgbParaHsl(
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ).h;
}

/* ---------- Botão flutuante (SVG) e cartão "Acessível com VLibras" (webp) ---------- */

let svgOriginal: string | null = null;

async function recolorirIcone(img: HTMLImageElement) {
    const hex = corPrimaria();
    if (!hex || img.dataset.recolorido === hex) return;

    const srcOriginal = img.dataset.srcOriginal ?? img.src;
    img.dataset.srcOriginal = srcOriginal;
    try {
        if (!svgOriginal) {
            const resp = await fetch(srcOriginal);
            if (!resp.ok) throw new Error("status " + resp.status);
            svgOriginal = await resp.text();
        }
        const css = getComputedStyle(document.documentElement);
        const claro = corParaHex(css.getPropertyValue("--primary-glow").trim());
        if (!claro) throw new Error("cor do tema inválida");

        const svg = svgOriginal.replace(AZUL_CLARO, claro).replace(AZUL_ESCURO, hex);
        if (svg === svgOriginal) throw new Error("nenhuma cor azul encontrada no SVG");

        img.onerror = () => {
            img.onerror = null;
            img.src = srcOriginal;
            img.style.setProperty("filter", "hue-rotate(115deg) saturate(1.1)", "important");
        };
        img.style.removeProperty("filter");
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        img.dataset.recolorido = hex;
    } catch {
        img.style.setProperty("filter", "hue-rotate(115deg) saturate(1.1)", "important");
    }
}

let popupBitmap: ImageBitmap | null = null;

async function recolorirPopup(img: HTMLImageElement) {
    const hex = corPrimaria();
    if (!hex || img.dataset.recolorido === hex) return;

    const srcOriginal = img.dataset.srcOriginal ?? img.src;
    img.dataset.srcOriginal = srcOriginal;
    try {
        if (!popupBitmap) {
            const resp = await fetch(srcOriginal);
            if (!resp.ok) throw new Error("status " + resp.status);
            popupBitmap = await createImageBitmap(await resp.blob());
        }
        const alvoH = matizDe(hex);

        const canvas = document.createElement("canvas");
        canvas.width = popupBitmap.width;
        canvas.height = popupBitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(popupBitmap, 0, 0);

        const dados = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = dados.data;
        for (let i = 0; i < px.length; i += 4) {
            if (px[i + 3] === 0) continue;
            const { h, s, l } = rgbParaHsl(px[i], px[i + 1], px[i + 2]);
            if (h < 190 || h > 260 || s < 0.1 || l < 0.3) continue; // não é o azul do cartão
            const [r, g, b] = hslParaRgb(alvoH, s, l);
            px[i] = r;
            px[i + 1] = g;
            px[i + 2] = b;
        }
        ctx.putImageData(dados, 0, 0);

        img.src = canvas.toDataURL("image/png");
        img.dataset.recolorido = hex;
    } catch {
        // Sem permissão para ler a imagem: mantém o cartão original
    }
}

/* ---------- Painel: cores fixas para cada modo (claro e escuro) ---------- */

// O texto e o fundo de cada modo andam sempre juntos, então nunca ficam ilegíveis.
const PAINEL_CSS = `
:host {
  color-scheme: light;
  --primary: oklch(0.6 0.22 0) !important;
  --primary-foreground: oklch(0.99 0.005 340) !important;
  --background: oklch(0.97 0.008 340) !important;
  --foreground: oklch(0.14 0.02 340) !important;
  --popover: oklch(0.97 0.008 340) !important;
  --popover-foreground: oklch(0.14 0.02 340) !important;
  --secondary: oklch(0.87 0.03 340) !important;
  --secondary-foreground: oklch(0.18 0.03 340) !important;
  --muted: oklch(0.92 0.012 340) !important;
  --muted-foreground: oklch(0.4 0.03 340) !important;
  --accent: oklch(0.85 0.09 350) !important;
  --accent-foreground: oklch(0.22 0.13 0) !important;
  --border: oklch(0.84 0.02 340) !important;
  --input: oklch(0.84 0.02 340) !important;
  --ring: oklch(0.6 0.22 0) !important;
  --color-blue-50: oklch(0.97 0.014 350) !important;
  --color-blue-500: oklch(0.6 0.22 0) !important;
  --color-blue-600: oklch(0.6 0.22 0) !important;
}

:host(.dark) {
  color-scheme: dark;
  --primary: oklch(0.7 0.23 5) !important;
  --primary-foreground: oklch(0.99 0 0) !important;
  --background: oklch(0.13 0.015 340) !important;
  --foreground: oklch(0.98 0.005 340) !important;
  --popover: oklch(0.18 0.02 340) !important;
  --popover-foreground: oklch(0.98 0.005 340) !important;
  --secondary: oklch(0.26 0.025 340) !important;
  --secondary-foreground: oklch(0.98 0.005 340) !important;
  --muted: oklch(0.22 0.02 340) !important;
  --muted-foreground: oklch(0.75 0.02 340) !important;
  --accent: oklch(0.32 0.1 350) !important;
  --accent-foreground: oklch(0.98 0.005 340) !important;
  --border: oklch(1 0 0 / 14%) !important;
  --input: oklch(1 0 0 / 16%) !important;
  --ring: oklch(0.7 0.23 5) !important;
  --color-blue-500: oklch(0.7 0.23 5) !important;
  --color-blue-600: oklch(0.7 0.23 5) !important;
}

/* Garante texto legível em campos de digitação (tradutor, dicionário) */
:host textarea,
:host input {
  color: var(--foreground) !important;
}

/* Fundo atrás do avatar (era #f8f8f8 / #222222 fixos) */
:host [class*="f8f8f8"] {
  background-color: var(--background) !important;
}
`;

function aplicarNoPainel(root: ShadowRoot) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(PAINEL_CSS);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}

/* ---------- Descoberta das shadow roots ---------- */

const raizesPainel = new WeakSet<ShadowRoot>();
const hostsPainel = new Set<Element>();
const raizesAcesso = new Set<ShadowRoot>();

// O painel tem um modo escuro próprio, ativado pela classe "dark" no elemento do widget
function sincronizarTema() {
    const escuro = document.documentElement.classList.contains("dark");
    hostsPainel.forEach((host) => host.classList.toggle("dark", escuro));
}

function varrer() {
    document.querySelectorAll("*").forEach((el) => {
        const root = el.shadowRoot;
        if (!root) return;

        if (!raizesPainel.has(root) && root.querySelector("#vlibras-app, style[data-widget-styles]")) {
            raizesPainel.add(root);
            hostsPainel.add(el);
            aplicarNoPainel(root);
            sincronizarTema();
        }
        if (!raizesAcesso.has(root) && root.querySelector("#vlibras-access")) {
            raizesAcesso.add(root);
            recolorirAcesso();
        }
    });
}

function recolorirAcesso() {
    raizesAcesso.forEach((root) => {
        root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
            if (img.id === "vlibras-popup") recolorirPopup(img);
            else recolorirIcone(img);
        });
    });
}

export function VLibras() {
    useEffect(() => {
        let ms = 0;
        let manual = false;
        const timer = window.setInterval(() => {
            ms += 300;

            // Se o script carregou mas o widget não subiu sozinho em 3s, inicia manualmente
            if (ms >= 3000 && !manual && window.VLibras && !window.VLibrasWidget) {
                manual = true;
                new window.VLibras.Widget(VLIBRAS_ROOT);
            }

            varrer();
            if (ms >= 30000) window.clearInterval(timer);
        }, 300);

        // Elementos novos do widget (ex.: painel criado ao abrir)
        let debounce: number | undefined;
        const aoMudarBody = new MutationObserver(() => {
            window.clearTimeout(debounce);
            debounce = window.setTimeout(varrer, 200);
        });
        aoMudarBody.observe(document.body, { childList: true });

        const aoClicar = () => window.setTimeout(varrer, 500);
        document.addEventListener("click", aoClicar, true);

        // Troca de tema claro/escuro do seu site
        const aoMudarTema = new MutationObserver(() => {
            sincronizarTema();
            recolorirAcesso();
        });
        aoMudarTema.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            window.clearInterval(timer);
            window.clearTimeout(debounce);
            aoMudarBody.disconnect();
            aoMudarTema.disconnect();
            document.removeEventListener("click", aoClicar, true);
        };
    }, []);

    return null;
}