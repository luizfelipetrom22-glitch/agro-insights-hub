/** Regras do sistema antigolpe do marketplace. */

export type RiskLevel = "ok" | "atencao" | "alto";

export const REPORT_REASONS = [
  "Preço muito abaixo do mercado (isca)",
  "Pediu pagamento antecipado / sinal via Pix",
  "Produto ou fotos falsas",
  "Perfil se passando por outra pessoa ou empresa",
  "Quer negociar apenas fora da plataforma",
  "Cobrança de taxa de frete ou liberação",
  "Conteúdo ofensivo ou spam",
  "Outro motivo",
] as const;

export const SAFETY_TIPS = [
  "Nunca pague sinal, taxa de frete ou “liberação de carga” antes de conferir a mercadoria.",
  "Desconfie de preço muito abaixo do mercado — é a isca mais comum.",
  "Confira CNPJ/CPF, inscrição estadual e o endereço da fazenda antes de fechar.",
  "Mantenha a negociação no chat da plataforma: fica registrada e serve de prova.",
  "Peça vídeo ao vivo do lote e nota fiscal; fotos podem ser copiadas da internet.",
  "Prefira pagamento contra entrega, com conferência de peso e classificação.",
  "Confira se a chave Pix está no mesmo nome/CNPJ do vendedor anunciado.",
  "Na dúvida, denuncie. A denúncia é anônima para o outro lado.",
] as const;

/** Termos típicos de golpe encontrados em conversas. */
const SCAM_PATTERNS: { pattern: RegExp; label: string; level: RiskLevel }[] = [
  { pattern: /\b(sinal|entrada|adiantamento|antecipad[oa])\b/i, label: "pedido de pagamento antecipado", level: "alto" },
  { pattern: /\btaxa\s+(de\s+)?(frete|libera[cç][aã]o|dep[oó]sito|garantia)\b/i, label: "cobrança de taxa suspeita", level: "alto" },
  { pattern: /\bpix\b[^.]{0,40}\b(agora|urgente|hoje|imediat)/i, label: "urgência para pagar no Pix", level: "alto" },
  { pattern: /\b(transfer[eê]ncia|dep[oó]sito)\b[^.]{0,30}\b(antes|primeiro)\b/i, label: "transferência antes da entrega", level: "alto" },
  { pattern: /\b(fora d[ao] (plataforma|site|app)|s[oó] (por|no) whats)\b/i, label: "insistência em sair da plataforma", level: "atencao" },
  { pattern: /\b(bit\.ly|tinyurl|encurtador|cutt\.ly)\b/i, label: "link encurtado", level: "atencao" },
  { pattern: /\b(cart[aã]o de cr[eé]dito|senha|c[oó]digo de verifica[cç][aã]o|token)\b/i, label: "pedido de dado sensível", level: "alto" },
];

export function scanMessage(text: string | null | undefined): { level: RiskLevel; reasons: string[] } {
  if (!text) return { level: "ok", reasons: [] };
  const hits = SCAM_PATTERNS.filter((p) => p.pattern.test(text));
  if (hits.length === 0) return { level: "ok", reasons: [] };
  const level: RiskLevel = hits.some((h) => h.level === "alto") ? "alto" : "atencao";
  return { level, reasons: [...new Set(hits.map((h) => h.label))] };
}

/** Converte "R$ 131,84" em 131.84. */
export function parseBRL(value: string): number | null {
  const clean = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number(clean);
  return Number.isFinite(num) ? num : null;
}

const TICKER_BY_PRODUCT: Record<string, { label: string; unit: string }> = {
  Soja: { label: "Soja", unit: "saco" },
  Milho: { label: "Milho", unit: "saco" },
  Café: { label: "Café", unit: "saco" },
  "Boi Gordo": { label: "Boi Gordo", unit: "arroba" },
};

/** Compara o preço do anúncio com a cotação real do dia. */
export function priceRisk(
  listing: { product: string; price: number | null; unit: string },
  tickers: { label: string; value: string }[] | undefined,
): { level: RiskLevel; message: string; reference: number } | null {
  if (!listing.price || !tickers?.length) return null;
  const config = TICKER_BY_PRODUCT[listing.product];
  if (!config || config.unit !== listing.unit) return null;
  const ticker = tickers.find((t) => t.label === config.label);
  const reference = ticker ? parseBRL(ticker.value) : null;
  if (!reference) return null;
  const ratio = listing.price / reference;
  if (ratio <= 0.5) {
    return {
      level: "alto",
      message: `Preço ${Math.round((1 - ratio) * 100)}% abaixo da cotação do dia (${brl(reference)}/${listing.unit}). Golpe comum: isca com preço irreal.`,
      reference,
    };
  }
  if (ratio <= 0.7) {
    return {
      level: "atencao",
      message: `Preço bem abaixo da cotação do dia (${brl(reference)}/${listing.unit}). Confirme a procedência antes de negociar.`,
      reference,
    };
  }
  return null;
}

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type TrustInput = {
  verified: boolean;
  hasAvatar: boolean;
  hasPhone: boolean;
  hasFarmName: boolean;
  hasLocation: boolean;
  hasBio: boolean;
  createdAt: string | null;
  listingsCount: number;
  openReports: number;
};

export type Trust = { score: number; level: RiskLevel; label: string; reasons: string[] };

/** Selo de confiança calculado a partir de sinais objetivos do perfil. */
export function trustScore(input: TrustInput): Trust {
  const reasons: string[] = [];
  let score = 20;

  if (input.verified) { score += 25; reasons.push("Conta verificada pela plataforma"); }
  if (input.hasAvatar) score += 5;
  if (input.hasPhone) { score += 10; reasons.push("Telefone cadastrado"); }
  if (input.hasFarmName) score += 5;
  if (input.hasLocation) { score += 10; reasons.push("Cidade e estado informados"); }
  if (input.hasBio) score += 5;

  const days = input.createdAt
    ? Math.floor((Date.now() - new Date(input.createdAt).getTime()) / 86_400_000)
    : 0;
  if (days >= 180) { score += 15; reasons.push("Conta com mais de 6 meses"); }
  else if (days >= 30) { score += 8; reasons.push("Conta com mais de 30 dias"); }
  else reasons.push("Conta criada recentemente");

  if (input.listingsCount >= 3) { score += 10; reasons.push(`${input.listingsCount} anúncios publicados`); }
  else if (input.listingsCount >= 1) score += 5;

  if (input.openReports > 0) {
    score -= 30 * Math.min(input.openReports, 2);
    reasons.push(`${input.openReports} denúncia(s) em análise`);
  }

  score = Math.max(0, Math.min(100, score));
  const level: RiskLevel = input.openReports > 0 || score < 40 ? "alto" : score < 70 ? "atencao" : "ok";
  const label = level === "ok" ? "Perfil confiável" : level === "atencao" ? "Confiança parcial" : "Atenção redobrada";
  return { score, level, label, reasons };
}

export const RISK_STYLE: Record<RiskLevel, string> = {
  ok: "border-harvest-green/30 bg-harvest-green/10 text-harvest-green",
  atencao: "border-clay/40 bg-clay/10 text-clay",
  alto: "border-loss/40 bg-loss/10 text-loss",
};
