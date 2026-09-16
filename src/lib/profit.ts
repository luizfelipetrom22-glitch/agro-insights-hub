import type { ProducerSeason } from "@/hooks/use-producer-season";

const costFields = [
  "seeds_fertilizers_cost_ha",
  "operation_cost_ha",
  "harvest_cost_ha",
  "freight_storage_cost_ha",
  "land_cost_ha",
] as const;

export const COST_LABELS: Record<(typeof costFields)[number], string> = {
  seeds_fertilizers_cost_ha: "Insumos",
  operation_cost_ha: "Operação",
  harvest_cost_ha: "Colheita e secagem",
  freight_storage_cost_ha: "Frete e armazenagem",
  land_cost_ha: "Terra / arrendamento",
};

export function seasonFinancialBase(season: ProducerSeason | null | undefined) {
  if (!season) return null;
  const area = Number(season.area_hectares);
  const productivity = Number(season.expected_yield_bags_ha);
  const margin = Number(season.target_margin_pct);
  const costPerHa = costFields.reduce((sum, field) => sum + Number(season[field] ?? 0), 0);
  if (!(area > 0 && productivity > 0 && costPerHa >= 0 && margin >= 0 && margin < 100)) return null;
  const production = area * productivity;
  const costPerBag = costPerHa / productivity;
  const totalCost = area * costPerHa;
  const targetPrice = costPerBag / (1 - margin / 100);
  const breakdown = costFields
    .map((field) => ({
      key: field,
      label: COST_LABELS[field],
      perHa: Number(season[field] ?? 0),
      share: costPerHa > 0 ? (Number(season[field] ?? 0) / costPerHa) * 100 : 0,
    }))
    .sort((a, b) => b.perHa - a.perHa);
  return {
    area,
    productivity,
    margin,
    costPerHa,
    production,
    costPerBag,
    totalCost,
    targetPrice,
    breakdown,
  };
}

export type FinancialBase = NonNullable<ReturnType<typeof seasonFinancialBase>>;

export type RadarItem = {
  id: string;
  tone: "gain" | "loss" | "neutral";
  kind: "Oportunidade" | "Risco" | "Contexto";
  title: string;
  detail: string;
  impact?: string;
  actionLabel: string;
  to: "/simulador" | "/minha-producao";
};

export type ProfitRadarResult = {
  price: number;
  revenue: number;
  result: number;
  marginPct: number;
  marginPerBag: number;
  breakevenPrice: number;
  gapToTarget: number;
  items: RadarItem[];
};

/** Leitura financeira determinística da safra frente à cotação de referência. */
export function buildProfitRadar(
  base: FinancialBase,
  market: { price: number; changePct?: number | undefined },
): ProfitRadarResult {
  const price = market.price;
  const revenue = base.production * price;
  const result = revenue - base.totalCost;
  const marginPct = revenue > 0 ? (result / revenue) * 100 : 0;
  const marginPerBag = price - base.costPerBag;
  const gapToTarget = price - base.targetPrice;
  const items: RadarItem[] = [];

  if (marginPerBag >= 0) {
    items.push({
      id: "margem",
      tone: "gain",
      kind: "Oportunidade",
      title: `Margem estimada de ${formatPrice(marginPerBag)} por saca`,
      detail: `Com a referência atual de ${formatPrice(price)}/sc e o seu custo de ${formatPrice(base.costPerBag)}/sc, o resultado estimado da safra é ${formatMoney(result)}.`,
      impact: `Resultado estimado ${formatMoney(result)}`,
      actionLabel: "Simular venda",
      to: "/simulador",
    });
  } else {
    items.push({
      id: "margem",
      tone: "loss",
      kind: "Risco",
      title: `Preço abaixo do seu ponto de equilíbrio`,
      detail: `A referência atual (${formatPrice(price)}/sc) está ${formatPrice(Math.abs(marginPerBag))} abaixo do seu custo por saca (${formatPrice(base.costPerBag)}/sc).`,
      impact: `Prejuízo estimado ${formatMoney(Math.abs(result))}`,
      actionLabel: "Ver custos",
      to: "/minha-producao",
    });
  }

  if (gapToTarget < 0) {
    items.push({
      id: "meta",
      tone: "neutral",
      kind: "Risco",
      title: `Faltam ${formatPrice(Math.abs(gapToTarget))} por saca para sua margem de ${base.margin.toLocaleString("pt-BR")}%`,
      detail: `Você precisaria vender a ${formatPrice(base.targetPrice)}/sc para atingir a margem desejada.`,
      impact: `Diferença total ${formatMoney(Math.abs(gapToTarget) * base.production)}`,
      actionLabel: "Simular preço-alvo",
      to: "/simulador",
    });
  } else {
    items.push({
      id: "meta",
      tone: "gain",
      kind: "Oportunidade",
      title: `Referência ${formatPrice(gapToTarget)} por saca acima da sua meta`,
      detail: `Sua margem desejada é atingida a partir de ${formatPrice(base.targetPrice)}/sc. A referência atual já supera esse valor.`,
      impact: `Ganho acima da meta ${formatMoney(gapToTarget * base.production)}`,
      actionLabel: "Simular venda",
      to: "/simulador",
    });
  }

  const biggest = base.breakdown[0];
  if (biggest && biggest.perHa > 0) {
    const tenPct = biggest.perHa * 0.1 * base.area;
    items.push({
      id: "custo",
      tone: "neutral",
      kind: "Oportunidade",
      title: `${biggest.label} concentra ${Math.round(biggest.share)}% do seu custo`,
      detail: `São ${formatMoney(biggest.perHa)}/ha dentro de um custo total de ${formatMoney(base.costPerHa)}/ha. Reduzir 10% deste grupo mudaria o resultado da safra.`,
      impact: `Impacto de 10% ${formatMoney(tenPct)}`,
      actionLabel: "Ver custos",
      to: "/minha-producao",
    });
  }

  const change = market.changePct ?? 0;
  if (Math.abs(change) >= 0.5) {
    const delta = (price - price / (1 + change / 100)) * base.production;
    items.push({
      id: "variacao",
      tone: change > 0 ? "gain" : "loss",
      kind: change > 0 ? "Oportunidade" : "Risco",
      title: `A referência ${change > 0 ? "subiu" : "caiu"} ${Math.abs(change).toFixed(1).replace(".", ",")}% no último pregão`,
      detail: `Aplicada à sua produção estimada de ${Math.round(base.production).toLocaleString("pt-BR")} sacas, essa variação altera o resultado da safra.`,
      impact: `${delta >= 0 ? "+" : "−"}${formatMoney(Math.abs(delta))}`,
      actionLabel: "Simular impacto",
      to: "/simulador",
    });
  }

  return {
    price,
    revenue,
    result,
    marginPct,
    marginPerBag,
    breakevenPrice: base.costPerBag,
    gapToTarget,
    items,
  };
}

/** Valores por saca precisam de centavos. */
export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
