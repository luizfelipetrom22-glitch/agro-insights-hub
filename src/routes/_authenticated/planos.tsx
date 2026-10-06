import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { usePlan } from "@/hooks/use-plan";
import { PLAN_FEATURES } from "@/lib/plan-limits";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({
    meta: [
      { title: "Planos Grátis e Premium — TerraIntelligence" },
      { name: "description", content: "Compare o que está incluído nos planos Grátis e Premium da TerraIntelligence." },
      { property: "og:title", content: "Planos — TerraIntelligence" },
      { property: "og:description", content: "Inteligência financeira para a sua safra: veja os planos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const { data: session } = useProfile();
  const { plan } = usePlan();
  const interest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("plan_interest").insert({ user_id: session?.userId ?? "" });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => toast.success("Interesse registrado! Avisaremos quando o Premium estiver disponível."),
    onError: () => toast.error("Não foi possível registrar agora."),
  });

  const card = (name: string, key: "free" | "premium", highlight: boolean) => (
    <div className={`flex flex-col rounded-2xl border p-6 ${highlight ? "border-clay/40 bg-clay/5" : "border-soil-brown/10 bg-card"}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl text-harvest-green">{name}</h2>
        {plan === key && <span className="rounded-full bg-harvest-green/15 px-2 py-0.5 text-xs font-semibold text-harvest-green">Seu plano</span>}
      </div>
      <ul className="mt-5 flex-1 space-y-2.5">
        {PLAN_FEATURES[key].map((f) => (
          <li key={f} className="flex gap-2 text-sm text-soil-brown/80">
            <Check className="mt-0.5 size-4 shrink-0 text-harvest-green" aria-hidden />{f}
          </li>
        ))}
      </ul>
      {key === "premium" && plan !== "premium" && (
        <button
          onClick={() => interest.mutate()}
          disabled={interest.isPending}
          className="mt-6 rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-clay-foreground hover:bg-clay/90 disabled:opacity-60"
        >
          Quero o Premium
        </button>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl text-harvest-green">Planos</h1>
          <p className="mt-1 text-sm text-soil-brown/60">
            A assinatura online ainda não está aberta. Registre seu interesse e avisaremos quando o Premium for liberado.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {card("Grátis", "free", false)}
          {card("Premium", "premium", true)}
        </div>
      </div>
    </AppShell>
  );
}
