import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AnalystInput = z.object({
  question: z.string().min(3).max(500),
  context: z.object({
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
  }),
});

/**
 * Analista da propriedade: responde perguntas do produtor usando apenas os
 * números reais da safra e da cotação de referência enviados no contexto.
 */
export const askPropertyAnalyst = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalystInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Análise por IA indisponível no momento (configuração ausente).");

    const c = data.context;
    const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
    const linhas = [
      `Safra: ${c.seasonName} (${c.crop})`,
      `Área: ${c.areaHectares} ha · Produtividade: ${c.productivityBagsHa} sacas/ha · Produção estimada: ${Math.round(c.production)} sacas`,
      `Custo por hectare: ${brl(c.costPerHa)} · Custo total: ${brl(c.totalCost)} · Custo por saca: ${brl(c.costPerBag)}`,
      `Margem desejada: ${c.targetMarginPct}% · Preço necessário para essa margem: ${brl(c.targetPrice)}/saca`,
      `Custos por grupo (R$/ha e % do custo): ${c.costBreakdown.map((b) => `${b.label}: ${brl(b.perHa)} (${Math.round(b.share)}%)`).join("; ")}`,
      c.market
        ? `Referência de mercado atual: ${brl(c.market.price)}/saca (${c.market.hint}; variação ${c.market.changePct !== null ? `${c.market.changePct.toFixed(1)}%` : "não informada"}). Com essa referência: receita ${brl(c.market.revenue)}, resultado ${brl(c.market.result)}, margem ${c.market.marginPct.toFixed(1)}%, margem por saca ${brl(c.market.marginPerBag)}. A referência é de bolsa convertida, não preço local.`
        : "Não há cotação de referência disponível para esta cultura no momento.",
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        Authorization: `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning_effort: "low",
        max_completion_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              "Você é o analista financeiro da propriedade rural do usuário, dentro da plataforma TerraIntelligence. " +
              "Responda em português do Brasil, tom direto e prático, no máximo 120 palavras, sem saudações nem listas longas. " +
              "Use SOMENTE os números fornecidos no contexto; nunca invente dados, preços ou benchmarks. " +
              "Se faltar informação para responder, diga claramente o que falta e oriente o produtor a completar o cadastro da safra. " +
              "Sempre que citar a cotação, deixe claro que é referência de bolsa convertida, não preço local.",
          },
          { role: "user", content: `Dados da propriedade:\n${linhas}\n\nPergunta do produtor: ${data.question}` },
        ],
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error("A IA não conseguiu responder agora. Tente novamente em instantes.");
    }

    // Consome o stream SSE no servidor e devolve apenas o texto final.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          answer += json.choices?.[0]?.delta?.content ?? "";
        } catch {
          // ignora linhas parciais
        }
      }
    }

    const text = answer.trim();
    if (!text) throw new Error("A IA não retornou uma análise. Tente reformular a pergunta.");
    return { answer: text };
  });
