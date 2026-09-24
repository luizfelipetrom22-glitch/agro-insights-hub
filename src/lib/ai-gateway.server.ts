/** Chamada ao Lovable AI (stream consumido no servidor, devolve só o texto). */
export async function completeText(system: string, user: string, maxTokens: number): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Análise por IA indisponível no momento (configuração ausente).");

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
      max_completion_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (res.status === 402) throw new Error("Os créditos de IA acabaram. Tente novamente mais tarde.");
  if (res.status === 429) throw new Error("Muitas solicitações agora. Aguarde um minuto e tente de novo.");
  if (!res.ok || !res.body) throw new Error("A IA não conseguiu responder agora. Tente novamente em instantes.");

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
        // linha parcial
      }
    }
  }
  const text = answer.trim();
  if (!text) throw new Error("A IA não retornou uma análise. Tente novamente.");
  return text;
}
