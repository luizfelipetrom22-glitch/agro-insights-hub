import { Link } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { seasonCompleteness, useProducerSeason } from "@/hooks/use-producer-season";

export function DecisionOverview() {
  const { data: session } = useProfile();
  const season = useProducerSeason(session?.userId);
  const readiness = seasonCompleteness(season.data);

  return (
    <section data-tour="decision-overview">
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
        <Link
          to="/minha-producao"
          className="flex items-center gap-3 text-sm text-soil-brown/60 transition-colors hover:text-harvest-green"
        >
          {readiness.complete ? (
            <CheckCircle2 className="size-5 text-gain" aria-hidden />
          ) : (
            <CircleAlert className="size-5 text-clay" aria-hidden />
          )}
          <span>
            {readiness.done} de {readiness.total} dados essenciais informados
          </span>
        </Link>
      </div>
    </section>
  );
}