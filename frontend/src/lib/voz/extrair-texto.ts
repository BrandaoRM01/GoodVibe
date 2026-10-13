const IGNORAR =
    '[data-voz-ignorar],[aria-hidden="true"],[hidden],script,style,noscript,svg,canvas,template';
const INTERATIVOS =
    'button,a[href],summary,[role="button"],[role="link"],[role="menuitem"],[role="tab"],[role="switch"],[role="checkbox"],[role="radio"]';
const CAMPOS = "input,textarea,select";
const TEXTUAIS =
    'h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,legend,label,th,td,dt,dd,[role="heading"],[role="alert"],[role="status"],[data-voz-texto]';
const MAX = 1200;

type Campo = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const limpar = (s: string) => s.replace(/\s+/g, " ").trim();
const soSimbolos = (s: string) => !/[\p{L}\p{N}]/u.test(s);

function visivel(el: Element | null): boolean {
    const e = el as (Element & { checkVisibility?: () => boolean }) | null;
    return !e || typeof e.checkVisibility !== "function" || e.checkVisibility();
}

function cortar(s: string): string {
    if (s.length <= MAX) return s;
    const i = s.lastIndexOf(" ", MAX);
    return s.slice(0, i > 0 ? i : MAX);
}

/** Texto visível de um elemento, sem ocultos, ícones, campos e repetições consecutivas */
function textoDe(raiz: Element): string {
    const partes: string[] = [];
    const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
            if (n.nodeType === Node.ELEMENT_NODE) {
                const e = n as Element;
                return e.matches(IGNORAR) || e.matches(CAMPOS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = limpar(n.textContent ?? "");
        if (t && !soSimbolos(t) && visivel(n.parentElement)) partes.push(t);
    }
    return partes.filter((t, i) => t !== partes[i - 1]).join(" ");
}

function descreverInterativo(el: Element): string {
    const nome = limpar(el.getAttribute("aria-label") ?? "") || textoDe(el) || limpar(el.getAttribute("title") ?? "");
    if (!nome || (nome.length <= 2 && !el.getAttribute("aria-label"))) return ""; // avatar com iniciais
    const role = el.getAttribute("role");
    const papel =
        el.tagName === "A" || role === "link"
            ? "link"
            : role === "switch"
                ? "interruptor"
                : role === "tab"
                    ? "aba"
                    : role === "checkbox" || role === "radio"
                        ? "opção"
                        : "botão";
    const estado = el.getAttribute("aria-pressed") ?? el.getAttribute("aria-checked");
    const extra = estado === "true" ? ", ativado" : estado === "false" ? ", desativado" : "";
    return `${nome}, ${papel}${extra}`;
}

function descreverCampo(el: Campo): string {
    const tipo = el instanceof HTMLInputElement ? el.type : el instanceof HTMLSelectElement ? "select" : "textarea";
    const rotulos = Array.from(el.labels ?? []).map(textoDe).join(" ");
    const nome = limpar(el.getAttribute("aria-label") || rotulos || el.getAttribute("placeholder") || el.title || "");
    const marcado = (el as HTMLInputElement).checked ? "marcada" : "desmarcada";

    let papel = "campo de texto";
    if (tipo === "password") papel = "campo de senha";
    else if (tipo === "checkbox") papel = `caixa de seleção, ${marcado}`;
    else if (tipo === "radio") papel = `opção, ${marcado}`;
    else if (tipo === "select") papel = "lista de opções";
    else if (["button", "submit", "reset"].includes(tipo)) return `${(el as HTMLInputElement).value}, botão`;
    else if (tipo === "file") papel = "seletor de arquivo";

    // Mensagens de validação ligadas ao campo (aria-describedby)
    const msgs = (el.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .map((id) => (id ? document.getElementById(id) : null))
        .filter((e): e is HTMLElement => !!e)
        .map((e) => textoDe(e))
        .filter(Boolean)
        .join(". ");
    const erro = el.getAttribute("aria-invalid") === "true" ? "Erro de validação. " : "";

    return `${nome ? nome + ", " : ""}${papel}.${msgs ? ` ${erro}${msgs}` : ""}`;
}

/** Decide o que ler para o alvo de um clique. Retorna null quando não há nada relevante. */
export function textoParaLer(alvo: EventTarget | null): string | null {
    if (!(alvo instanceof Element)) return null;
    const el = alvo;
    if (el.closest(IGNORAR)) return null;

    const ctl = el.closest(CAMPOS) ?? el.closest("label")?.control ?? null;
    if (ctl && ctl.matches(CAMPOS)) return cortar(descreverCampo(ctl as Campo));

    const inter = el.closest(INTERATIVOS);
    if (inter) {
        const d = descreverInterativo(inter);
        return d ? cortar(d) : null;
    }

    if (el instanceof HTMLImageElement) {
        const alt = limpar(el.alt);
        return alt ? `Imagem: ${alt}` : null;
    }

    const semantico = el.closest(TEXTUAIS);
    const base = semantico ?? el;
    const t = textoDe(base);
    if (!t) return null;
    if (!semantico && t.length > 300) return null; // clique em contêiner grande: não lê a página

    // Em posts, comentários e mensagens, identifica de quem é o conteúdo
    const rotulo = base.closest("[data-voz-bloco]")?.getAttribute("data-voz-bloco") ?? "";
    return cortar(rotulo && !t.startsWith(rotulo) ? `${rotulo}. ${t}` : t);
}