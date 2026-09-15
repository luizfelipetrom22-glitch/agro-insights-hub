import type { ProducerSeason } from "@/hooks/use-producer-season";

const costFields = [
  "seeds_fertilizers_cost_ha",
  "operation_cost_ha",
  "harvest_cost_ha",
  "freight_storage_cost_ha",
  "land_cost_ha",
] as const;

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
  return { area, productivity, margin, costPerHa, production, costPerBag, totalCost, targetPrice };
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}