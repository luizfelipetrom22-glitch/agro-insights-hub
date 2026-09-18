import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, MessageCircleQuestion, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useTickers } from "@/hooks/use-market";
import { seasonCompleteness, useProducerSeason } from "@/hooks/use-producer-season";
import { buildProfitRadar, seasonFinancialBase } from "@/lib/profit";
import { askPropertyAnalyst } from "@/lib/analyst.functions";

const SUGGESTED = [
  "Qual é o meu maior custo e o que posso fazer?",
  "Que preço eu preciso para a margem que quero?",
  "Vale a pena vender com a referência de hoje?",
  "Onde estou perdendo mais dinheiro?",
];

export function PropertyAnalyst() {
  const { data: session } = useProfile();
  const season = useProducerSeason(session?.userId);
  const tickers = useTickers();
  const ask = useServerFn(askPropertyAnalyst);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const readiness = seasonCompleteness(season.data);
  const base = seasonFinancialBase(season.data);
  const crop = season.data?.crop ?? "";
  const ticker = (tickers.data?.tickers ?? []).find((item) => item.label === crop);
  const radar =
    base && readiness.complete && ticker?.numeric
      ? buildProfitRadar(base, { price: ticker.numeric, changePct: ticker.changePct })
      : null;

  async function submit(q: string) {
    if (!base || !season.data || q.trim().length < 3 || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setQuestion(q);
    try {
      const { answer: text } = await ask({
        data: {
          question: q.trim(),
          context: {
            crop,
            seasonName: season.data.season_name ?? "",
            areaHectares: base.area,
            productivityBagsHa: base.productivity,
            costPerHa: base.costPerHa,
            totalCost: base.totalCost,
            production: base.production,
            costPerBag: base.costPerBag,
            targetMarginPct: base.margin,
            targetPrice: base.targetPrice,
            costBreakdown: base.breakdown.map((b) => ({ label: b.label, perHa: b.perHa, share: b.share })),
            market: radar && ticker?.numeric
              ? {
                  price: radar.price,
                  changePct: ticker.changePct ?? null,
                  hint: ticker.hint ?? "Referência de bolsa convertida",
                  revenue: radar.revenue,
                  result: radar.result,
                  marginPct: radar.marginPct,
                  marginPerBag: radar.marginPerBag,
                }
              : null,
          },
        },
      });
      setAnswer(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível obter a análise agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-b border-soil-brown/10 pb-8">
      <div className="flex items-center gap-3">
        <Sparkles className="size-5 text-clay" aria-hidden />
        <h2 className="font-serif text-2xl text-harvest-green">Analista da sua safra</h2>
      </div>

      {season.isLoading ? (
        <p className="mt-6 text-sm text-soil-brown/50">Preparando o analista…</p>
      ) : !base || !readiness.complete ? (
        <div className="mt-6 flex flex-col gap-5 border-l-2 border-clay pl-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h3 className="font-serif text-xl">Complete sua safra para conversar com o analista</h3>
            <p className="mt-1 text-sm text-soil-brown/65">
              O analista só trabalha com os seus números reais — sem safra cadastrada, ele prefere não
              responder a inventar dados.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/minha-producao">
              Cadastrar minha safra <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void submit(q)}
                disabled={loading}
                className="rounded-full border border-soil-brown/15 bg-card px-3.5 py-1.5 text-xs font-medium text-soil-brown transition-colors hover:border-clay/40 hover:text-harvest-green disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(question);
            }}
          >
            <div className="relative flex-1">
              <MessageCircleQuestion
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soil-brown/35"
                aria-hidden
              />
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pergunte sobre margem, custos ou preço da sua safra…"
                maxLength={500}
                className="w-full rounded-lg border border-soil-brown/15 bg-card py-2.5 pl-9 pr-3 text-sm text-soil-brown placeholder:text-soil-brown/40 focus:border-clay/50 focus:outline-none"
              />
            </div>
            <Button type="submit" disabled={loading || question.trim().length < 3}>
              {loading ? "Analisando…" : "Perguntar"}
            </Button>
          </form>

          {loading && (
            <p className="mt-4 text-sm text-soil-brown/50">
              Cruzando sua safra com o mercado para responder…
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg border border-loss/30 bg-loss/5 px-4 py-3 text-sm text-loss">
              {error}
            </p>
          )}
          {answer && (
            <div className="mt-4 border-l-2 border-harvest-green pl-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-soil-brown/45">
                {question}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-soil-brown/85">{answer}</p>
              <p className="mt-3 text-[11px] text-soil-brown/45">
                Análise gerada por IA exclusivamente a partir dos dados da sua safra e da referência de
                mercado do momento. Nenhum número foi estimado ou inventado.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
