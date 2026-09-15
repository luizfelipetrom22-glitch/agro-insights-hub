import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleAlert, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { seasonCompleteness, useProducerSeason } from "@/hooks/use-producer-season";
import { formatMoney, seasonFinancialBase } from "@/lib/profit";

export function DecisionOverview() {
  const { data: session } = useProfile();
  const season = useProducerSeason(session?.userId);
  const readiness = seasonCompleteness(season.data);
  const base = seasonFinancialBase(season.data);

  return (
    <section data-tour="decision-overview" className="border-b border-soil-brown/10 pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-clay">Visão financeira</p>
          <h1 className="mt-2 font-serif text-4xl text-harvest-green sm:text-5xl">
            Sua safra, traduzida em decisão.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-soil-brown/65">
            O mercado fornece os sinais. Sua produção fornece o contexto. Aqui você entende o que
            isso significa para a sua margem.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-soil-brown/60">
          {readiness.complete ? (
            <CheckCircle2 className="size-5 text-gain" aria-hidden />
          ) : (
            <CircleAlert className="size-5 text-clay" aria-hidden />
          )}
          <span>{readiness.done} de {readiness.total} dados essenciais informados</span>
        </div>
      </div>

      {season.isLoading ? (
        <p className="mt-8 text-sm text-soil-brown/50">Lendo os dados da sua safra…</p>
      ) : base && readiness.complete ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="border-l-2 border-harvest-green pl-5">
            <p className="text-xs font-bold uppercase tracking-widest text-soil-brown/45">
              Base para suas decisões · {season.data?.crop} {season.data?.season_name}
            </p>
            <p className="mt-3 font-serif text-4xl text-harvest-green">
              {formatMoney(base.targetPrice)} <span className="text-xl text-soil-brown/55">/ saca</span>
            </p>
            <p className="mt-2 max-w-xl text-sm text-soil-brown/65">
              Preço necessário para atingir a margem desejada de {base.margin.toLocaleString("pt-BR")}%.
              Este valor usa somente os custos e a produtividade que você informou.
            </p>
            <Button asChild className="mt-5">
              <Link to="/simulador">Simular uma decisão <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-l border-soil-brown/10 pl-6">
            <Metric label="Custo por hectare" value={formatMoney(base.costPerHa)} />
            <Metric label="Custo por saca" value={formatMoney(base.costPerBag)} />
            <Metric label="Produção estimada" value={`${base.production.toLocaleString("pt-BR")} sacas`} />
            <Metric label="Custo total" value={formatMoney(base.totalCost)} />
          </dl>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5 border-l-2 border-clay pl-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-2xl gap-4">
            <Sprout className="mt-1 size-6 shrink-0 text-harvest-green" aria-hidden />
            <div>
              <h2 className="font-serif text-2xl">Complete sua safra para calcular sua margem</h2>
              <p className="mt-1 text-sm text-soil-brown/65">
                Informe cultura, área, produtividade, custos e margem desejada. Não mostraremos
                estimativas sem os dados da sua propriedade.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/minha-producao">Cadastrar minha safra <ArrowRight aria-hidden /></Link>
          </Button>
        </div>
      )}
    </section>
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