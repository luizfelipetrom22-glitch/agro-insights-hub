import { formatMoney, formatPrice, type FinancialBase } from "@/lib/profit";

export type MarginCondition = "abaixo_equilibrio" | "abaixo_meta";

/** Monta o aviso de margem quando a referência está abaixo do limite; null caso contrário. */
export function buildMarginAlert(
  condition: MarginCondition,
  crop: string,
  price: number,
  base: FinancialBase,
) {
  const limit = condition === "abaixo_equilibrio" ? base.costPerBag : base.targetPrice;
  if (!(price > 0) || price >= limit) return null;
  const gap = limit - price;
  const title =
    condition === "abaixo_equilibrio"
      ? `🚨 ${crop}: referência abaixo do seu ponto de equilíbrio`
      : `⚠️ ${crop}: referência abaixo do preço da sua meta`;
  const body =
    condition === "abaixo_equilibrio"
      ? `A referência de bolsa está em ${formatPrice(price)}/sc, ${formatPrice(gap)} abaixo do seu custo de ${formatPrice(limit)}/sc. Prejuízo estimado na safra: ${formatMoney(gap * base.production)}.`
      : `A referência de bolsa está em ${formatPrice(price)}/sc. Para sua margem de ${base.margin}% você precisa de ${formatPrice(limit)}/sc — faltam ${formatMoney(gap * base.production)} na safra.`;
  return {
    type: `margin_alert:${condition}`,
    title,
    body,
    link: `/simulador?preco=${price.toFixed(2)}`,
  };
}
