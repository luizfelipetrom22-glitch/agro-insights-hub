export const UNITS = ["kg", "tonelada", "saco", "arroba", "litro"] as const;

export const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

export const CERTIFICATIONS = [
  "Orgânico Brasil",
  "GlobalG.A.P.",
  "Rainforest Alliance",
  "Fair Trade",
  "RTRS",
  "ISO 22000",
] as const;

export const PRODUCTS = [
  "Soja", "Milho", "Café", "Boi Gordo", "Trigo", "Algodão", "Feijão",
  "Arroz", "Cana-de-açúcar", "Laranja", "Leite", "Hortaliças",
] as const;

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "A combinar";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString("pt-BR")} ${unit}${quantity === 1 ? "" : "s"}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

/** Proximidade aproximada por cidade/estado (sem geocodificação). */
export function proximityScore(
  base: { state?: string | null; city?: string | null },
  target: { state?: string | null; city?: string | null },
): number {
  if (!base.state) return 2;
  if (base.state !== target.state) return 2;
  if (base.city && target.city && base.city.toLowerCase() === target.city.toLowerCase()) return 0;
  return 1;
}

export function proximityLabel(score: number): string {
  if (score === 0) return "Mesma cidade";
  if (score === 1) return "Mesmo estado";
  return "Outro estado";
}
