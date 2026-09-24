import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { completeText } from "./ai-gateway.server";
import { checkAndLogUsage } from "./plan.server";
import { FREE_LIMITS } from "./plan-limits";

const SYSTEM =
  "Você é o analista financeiro da propriedade rural do usuário, dentro da plataforma TerraIntelligence. " +
  "Responda em português do Brasil, tom direto e prático, no máximo 120 palavras, sem saudações nem listas longas. " +
  "Use SOMENTE os números fornecidos no contexto; nunca invente dados, preços ou benchmarks. " +
  "Se faltar informação para responder, diga claramente o que falta e oriente o produtor a completar o cadastro da safra. " +
  "Sempre que citar a cotação, deixe claro que é referência de bolsa convertida, não preço local.";

export const SeasonContext = z.object({
    crop: z.string(),
    seasonName: z.string(),
    areaHectares: z.number(),
    productivityBagsHa: z.number(),
    costPerHa: z.number(),
    totalCost: z.number(),
    production: z.number(),
    costPerBag: z.number(),
    targetMarginPct: z.number(),
    targetPrice: z.number(),
    costBreakdown: z.array(z.object({ label: z.string(), perHa: z.number(), share: z.number() })),
    market: z
      .object({
        price: z.number(),
        changePct: z.number().nullable(),
        hint: z.string(),
        revenue: z.number(),
        result: z.number(),
        marginPct: z.number(),
        marginPerBag: z.number(),
      })
      .nullable(),
});
export type SeasonContextInput = z.infer<typeof SeasonContext>;

const AnalystInput = z.object({ question: z.string().min(3).max(500), context: SeasonContext });

export function describeSeason(c: SeasonContextInput): string {
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
  return [
      `Safra: ${c.seasonName} (${c.crop})`,
      `Área: ${c.areaHectares} ha · Produtividade: ${c.productivityBagsHa} sacas/ha · Produção estimada: ${Math.round(c.production)} sacas`,
      `Custo por hectare: ${brl(c.costPerHa)} · Custo total: ${brl(c.totalCost)} · Custo por saca: ${brl(c.costPerBag)}`,
      `Margem desejada: ${c.targetMarginPct}% · Preço necessário para essa margem: ${brl(c.targetPrice)}/saca`,
      `Custos por grupo (R$/ha e % do custo): ${c.costBreakdown.map((b) => `${b.label}: ${brl(b.perHa)} (${Math.round(b.share)}%)`).join("; ")}`,
      c.market
        ? `Referência de mercado atual: ${brl(c.market.price)}/saca (${c.market.hint}; variação ${c.market.changePct !== null ? `${c.market.changePct.toFixed(1)}%` : "não informada"}). Com essa referência: receita ${brl(c.market.revenue)}, resultado ${brl(c.market.result)}, margem ${c.market.marginPct.toFixed(1)}%, margem por saca ${brl(c.market.marginPerBag)}. A referência é de bolsa convertida, não preço local.`
        : "Não há cotação de referência disponível para esta cultura no momento.",
    ].join("\n");
}

/**
 * Analista da propriedade: responde perguntas do produtor usando apenas os
 * números reais da safra e da cotação de referência enviados no contexto.
 */
export const askPropertyAnalyst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalystInput.parse(input))
  .handler(async ({ data, context }) => {
    await checkAndLogUsage(
      context.supabase,
      context.userId,
      "analyst",
      FREE_LIMITS.analystPerDay,
      1,
      `No plano Grátis são ${FREE_LIMITS.analystPerDay} perguntas por dia. Volte amanhã ou conheça o Premium.`,
    );

    const linhas = describeSeason(data.context);

    const answer = await completeText(
      SYSTEM,
      `Dados da propriedade:\n${linhas}\n\nPergunta do produtor: ${data.question}`,
      600,
    );
    return { answer };
  });
