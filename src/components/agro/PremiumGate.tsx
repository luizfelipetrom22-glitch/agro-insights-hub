import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";

type Props = { title: string; description: string; children: ReactNode };

/** Mostra o conteúdo para Premium; para Grátis, explica o recurso e leva a Planos. */
export function PremiumGate({ title, description, children }: Props) {
  const { isPremium, isLoading } = usePlan();
  if (isLoading || isPremium) return <>{children}</>;
  return <PremiumNotice title={title} description={description} />;
}

export function PremiumNotice({ title, description }: Omit<Props, "children">) {
  return (
    <div className="rounded-2xl border border-clay/25 bg-clay/5 p-5">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-clay" aria-hidden />
        <span className="rounded bg-clay px-1.5 py-0.5 text-[10px] font-bold uppercase text-clay-foreground">Premium</span>
        <p className="font-serif text-lg text-soil-brown">{title}</p>
      </div>
      <p className="mt-2 text-sm text-soil-brown/70">{description}</p>
      <Link to="/planos" className="mt-3 inline-block text-sm font-semibold text-harvest-green underline-offset-2 hover:underline">
        Conhecer o Premium →
      </Link>
    </div>
  );
}
