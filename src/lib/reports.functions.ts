import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { completeText } from "./ai-gateway.server";
import { checkAndLogUsage } from "./plan.server";
import { FREE_LIMITS } from "./plan-limits";
import { SeasonContext, describeSeason } from "./analyst.functions";

const ReportInput = z.object({
  context: SeasonContext,
  scenarios: z
    .array(
      z.object({
        name: z.string().max(120),
        price: z.number(),
        result: z.number(),
        marginPct: z.number(),
      }),
    )
    .max(10),
});

const SYSTEM =
  "Você é o analista financeiro da propriedade rural do usuário na plataforma TerraIntelligence. " +
  "Escreva um relatório da safra em português do Brasil, em texto simples (sem markdown, sem asteriscos), com estas seções, cada uma iniciada pelo título em MAIÚSCULAS numa linha própria: " +
  "RESUMO, CUSTOS, MARGEM E PREÇO, CENÁRIOS, RECOMENDAÇÕES. Máximo de 450 palavras. " +
  "Use SOMENTE os números fornecidos; nunca invente preços, benchmarks, clima ou notícias. " +
  "Se faltar algum dado, diga claramente o que falta. Se não houver cenários salvos, diga isso na seção CENÁRIOS. " +
  "Ao citar a cotação, deixe claro que é referência de bolsa convertida, não preço local.";

export const generateSeasonReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReportInput.parse(input))
  .handler(async ({ data, context }) => {
    await checkAndLogUsage(
      context.supabase,
      context.userId,
      "report",
      FREE_LIMITS.reportsPerMonth,
      30,
      `No plano Grátis é ${FREE_LIMITS.reportsPerMonth} relatório por mês. Conheça o Premium para gerar sem limite.`,
    );

    const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
    const cenarios = data.scenarios.length
      ? data.scenarios
          .map((s) => `- ${s.name}: preço ${brl(s.price)}/saca, resultado ${brl(s.result)}, margem ${s.marginPct.toFixed(1)}%`)
          .join("\n")
      : "Nenhum cenário salvo.";

    const content = await completeText(
      SYSTEM,
      `Dados da propriedade:\n${describeSeason(data.context)}\n\nCenários salvos no simulador:\n${cenarios}`,
      1800,
    );

    const title = `Relatório da safra ${data.context.seasonName || data.context.crop}`.trim();
    const { data: row, error } = await context.supabase
      .from("reports")
      .insert({ user_id: context.userId, title, content, harvest: data.context.seasonName || null })
      .select("*")
      .single();
    if (error) throw new Error("O relatório foi gerado, mas não foi possível salvá-lo.");
    return row;
  });
