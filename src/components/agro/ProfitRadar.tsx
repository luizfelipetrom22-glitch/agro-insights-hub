import { Link } from "@tanstack/react-router";
import { ArrowRight, Radar, Sprout, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useTickers } from "@/hooks/use-market";
import { seasonCompleteness, useProducerSeason } from "@/hooks/use-producer-season";
import { buildProfitRadar, formatMoney, seasonFinancialBase } from "@/lib/profit";

/** Culturas com cotação de referência disponível hoje. */
const QUOTED_CROPS = ["Soja", "Milho", "Café", "Boi Gordo"];

export function ProfitRadar() {
  const { data: session } = useProfile();
  const season = useProducerSeason(session?.userId);
  const tickers = useTickers();
  const readiness = seasonCompleteness(season.data);
  const base = seasonFinancialBase(season.data);
  const crop = season.data?.crop ?? "";
  const ticker = (tickers.data?.tickers ?? []).find((item) => item.label === crop);
  const radar =
    base && readiness.complete && ticker?.numeric
      ? buildProfitRadar(base, { price: ticker.numeric, changePct: ticker.changePct })
      : null;

  return (
    <section data-tour="profit-radar" className="border-b border-soil-brown/10 pb-8">
      <div className="flex items-center gap-3">
        <Radar className="size-5 text-clay" aria-hidden />
        <h2 className="font-serif text-2xl text-harvest-green">Radar de Lucro</h2>
        {radar && (
          <span className="rounded-full border border-clay/30 bg-clay/10 px-2.5 py-0.5 text-[11px] font-semibold text-clay">
            {radar.items.length} leituras para a sua safra
          </span>
        )}
      </div>

      {season.isLoading || tickers.isLoading ? (
        <p className="mt-6 text-sm text-soil-brown/50">Cruzando sua safra com a referência de mercado…</p>
      ) : !readiness.complete || !base ? (
        <EmptyState
          title="Complete sua safra para ativar o Radar"
          description="Sem área, produtividade, custos e margem desejada não é possível calcular sua margem sem inventar números."
          actionLabel="Cadastrar minha safra"
          to="/minha-producao"
        />
      ) : !ticker?.numeric ? (
        <EmptyState
          title={`Ainda não há cotação de referência para ${crop || "esta cultura"}`}
          description={`Hoje temos referência convertida apenas para ${QUOTED_CROPS.join(", ")}. Você pode simular manualmente o preço de venda.`}
          actionLabel="Abrir simulador"
          to="/simulador"
        />
      ) : radar ? (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="border-l-2 border-harvest-green pl-5">
              <p className="text-xs font-bold uppercase tracking-widest text-soil-brown/45">
                Margem estimada · {crop} {season.data?.season_name}
              </p>
              <p
                className={`mt-3 font-serif text-4xl ${radar.marginPerBag >= 0 ? "text-harvest-green" : "text-loss"}`}
              >
                {formatMoney(radar.marginPerBag)}{" "}
                <span className="text-xl text-soil-brown/55">/ saca</span>
              </p>
              <p className="mt-2 max-w-xl text-sm text-soil-brown/65">
                Resultado estimado de {formatMoney(radar.result)} na safra, com margem de{" "}
                {radar.marginPct.toFixed(1).replace(".", ",")}%.
              </p>
              <p className="mt-3 text-[11px] text-soil-brown/45">
                {ticker.hint ?? "Referência de bolsa convertida"} · {formatMoney(radar.price)}/sc ·
                referência de mercado, não preço local de balcão.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-l border-soil-brown/10 pl-6">
              <Metric label="Ponto de equilíbrio" value={`${formatMoney(radar.breakevenPrice)}/sc`} />
              <Metric label="Preço para sua meta" value={`${formatMoney(base.targetPrice)}/sc`} />
              <Metric label="Receita estimada" value={formatMoney(radar.revenue)} />
              <Metric label="Custo total" value={formatMoney(base.totalCost)} />
            </dl>
          </div>

          <ul className="mt-8 divide-y divide-soil-brown/10 border-t border-soil-brown/10">
            {radar.items.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex max-w-3xl gap-4">
                  <span className="mt-1 shrink-0">
                    {item.tone === "loss" ? (
                      <TrendingDown className="size-5 text-loss" aria-hidden />
                    ) : item.tone === "gain" ? (
                      <TrendingUp className="size-5 text-gain" aria-hidden />
                    ) : (
                      <Sprout className="size-5 text-clay" aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-soil-brown/40">
                      {item.kind}
                      {item.impact ? ` · ${item.impact}` : ""}
                    </p>
                    <p className="mt-1 font-semibold text-soil-brown">{item.title}</p>
                    <p className="mt-1 text-sm text-soil-brown/65">{item.detail}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" className="shrink-0 self-start sm:self-center">
                  <Link to={item.to}>
                    {item.actionLabel} <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[11px] leading-relaxed text-soil-brown/45">
            Como calculamos: custo por saca = custo por hectare ÷ produtividade informada. Margem =
            (referência − custo por saca). Nenhum valor é estimado pela plataforma; usamos apenas os
            dados da sua safra e a cotação convertida do momento.
          </p>
        </>
      ) : null}
    </section>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  to,
}: {
  title: string;
  description: string;
  actionLabel: string;
  to: "/minha-producao" | "/simulador";
}) {
  return (
    <div className="mt-6 flex flex-col gap-5 border-l-2 border-clay pl-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl">
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="mt-1 text-sm text-soil-brown/65">{description}</p>
      </div>
      <Button asChild className="shrink-0">
        <Link to={to}>
          {actionLabel} <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-widest text-soil-brown/40">{label}</dt>
      <dd className="mt-1 font-serif text-2xl text-soil-brown">{value}</dd>
    </div>
  );
}
