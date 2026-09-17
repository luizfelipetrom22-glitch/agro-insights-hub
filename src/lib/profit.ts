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

// ---------------------------------------------------------------------------
// Cenários do simulador (mesmo motor determinístico do Radar)
// ---------------------------------------------------------------------------

export type ScenarioCosts = {
  insumos: number;
  operacao: number;
  colheita: number;
  frete: number;
  terra: number;
};

export const SCENARIO_COST_LABELS: Record<keyof ScenarioCosts, string> = {
  insumos: "Insumos (semente, adubo, defensivo)",
  operacao: "Operação (máquinas, diesel, mão de obra)",
  colheita: "Colheita e secagem",
  frete: "Frete e armazenagem",
  terra: "Arrendamento / custo da terra",
};

export type ScenarioInput = {
  areaHectares: number;
  yieldBagsHa: number;
  pricePerBag: number;
  targetMarginPct: number;
  costs: ScenarioCosts;
};

export type ScenarioSensitivityRow = {
  pct: number;
  price: number;
  profit: number;
  delta: number;
  marginPct: number;
};

export type ScenarioResult = {
  costPerHa: number;
  production: number;
  revenue: number;
  totalCost: number;
  profit: number;
  marginPct: number;
  costPerBag: number;
  targetPrice: number;
  breakEvenSacas: number;
  profitPerBag: number;
  sensitivity: ScenarioSensitivityRow[];
  breakdown: { key: keyof ScenarioCosts; value: number; share: number; perBag: number }[];
};

/** Motor determinístico do simulador — usado na tela, nos cenários salvos e na comparação. */
export function simulateScenario(input: ScenarioInput): ScenarioResult {
  const { areaHectares: area, yieldBagsHa: prod, pricePerBag: price, targetMarginPct: margemAlvo } = input;
  const costs = input.costs;
  const costPerHa = costs.insumos + costs.operacao + costs.colheita + costs.frete + costs.terra;
  const production = area * prod;
  const revenue = production * price;
  const totalCost = area * costPerHa;
  const profit = revenue - totalCost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const costPerBag = prod > 0 ? costPerHa / prod : 0;
  const targetPrice = margemAlvo < 100 ? costPerBag / (1 - margemAlvo / 100) : 0;
  const breakEvenSacas = price > 0 ? costPerHa / price : 0;
  const profitPerBag = price - costPerBag;
  const sensitivity = [-15, -10, -5, 0, 5, 10, 15].map((pct) => {
    const p = price * (1 + pct / 100);
    const rev = production * p;
    const prof = rev - totalCost;
    return {
      pct,
      price: p,
      profit: prof,
      delta: prof - profit,
      marginPct: rev > 0 ? (prof / rev) * 100 : 0,
    };
  });
  const breakdown = (Object.keys(SCENARIO_COST_LABELS) as (keyof ScenarioCosts)[])
    .map((key) => ({
      key,
      value: costs[key],
      share: costPerHa > 0 ? (costs[key] / costPerHa) * 100 : 0,
      perBag: prod > 0 ? costs[key] / prod : 0,
    }))
    .sort((a, b) => b.value - a.value);
  return {
    costPerHa,
    production,
    revenue,
    totalCost,
    profit,
    marginPct,
    costPerBag,
    targetPrice,
    breakEvenSacas,
    profitPerBag,
    sensitivity,
    breakdown,
  };
}

/** Pré-preenche o simulador a partir da safra cadastrada (custos ausentes viram 0). */
export function scenarioInputFromSeason(season: ProducerSeason): ScenarioInput {
  return {
    areaHectares: Number(season.area_hectares) || 0,
    yieldBagsHa: Number(season.expected_yield_bags_ha) || 0,
    pricePerBag: 0,
    targetMarginPct: Number(season.target_margin_pct) || 0,
    costs: {
      insumos: Number(season.seeds_fertilizers_cost_ha) || 0,
      operacao: Number(season.operation_cost_ha) || 0,
      colheita: Number(season.harvest_cost_ha) || 0,
      frete: Number(season.freight_storage_cost_ha) || 0,
      terra: Number(season.land_cost_ha) || 0,
    },
  };
}

type SimulationRow = {
  area_hectares: number;
  yield_bags_per_ha: number;
  price_per_bag: number;
  input_cost: number;
  target_margin_pct: number | null;
  seeds_fertilizers_cost_ha: number | null;
  operation_cost_ha: number | null;
  harvest_cost_ha: number | null;
  freight_storage_cost_ha: number | null;
  land_cost_ha: number | null;
};

/** Converte um cenário salvo no banco para o formato do motor. */
export function scenarioInputFromRow(row: SimulationRow): ScenarioInput {
  const hasDetailedCosts =
    row.seeds_fertilizers_cost_ha !== null ||
    row.operation_cost_ha !== null ||
    row.harvest_cost_ha !== null ||
    row.freight_storage_cost_ha !== null ||
    row.land_cost_ha !== null;
  return {
    areaHectares: Number(row.area_hectares) || 0,
    yieldBagsHa: Number(row.yield_bags_per_ha) || 0,
    pricePerBag: Number(row.price_per_bag) || 0,
    targetMarginPct: Number(row.target_margin_pct) || 0,
    costs: hasDetailedCosts
      ? {
          insumos: Number(row.seeds_fertilizers_cost_ha) || 0,
          operacao: Number(row.operation_cost_ha) || 0,
          colheita: Number(row.harvest_cost_ha) || 0,
          frete: Number(row.freight_storage_cost_ha) || 0,
          terra: Number(row.land_cost_ha) || 0,
        }
      : { insumos: Number(row.input_cost) || 0, operacao: 0, colheita: 0, frete: 0, terra: 0 },
  };
}
