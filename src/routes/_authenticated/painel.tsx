import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/agro/AppShell";
import { DecisionOverview } from "@/components/agro/DecisionOverview";
import { ProfitRadar } from "@/components/agro/ProfitRadar";
import { InsightAndNews } from "@/components/agro/InsightAndNews";
import { HistoricalComparison } from "@/components/agro/HistoricalComparison";
import { OnboardingTour } from "@/components/agro/OnboardingTour";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Visão Geral Financeira — TerraIntelligence" },
      {
        name: "description",
        content:
          "Entenda custos, margem e decisões da sua safra com o contexto do mercado agrícola.",
      },
      { property: "og:title", content: "Visão Geral Financeira — TerraIntelligence" },
      { property: "og:description", content: "Transforme mercado e produção em decisões para aumentar sua margem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const tour = useOnboardingTour();
  const { data: session, isLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session && session.userType === "comprador") {
      void navigate({ to: "/comprador" });
    }
  }, [isLoading, session, navigate]);

  return (
    <AppShell onHelp={tour.start}>
      <DecisionOverview />
      <ProfitRadar />
      <InsightAndNews />
      <HistoricalComparison />
      <OnboardingTour tour={tour} />
    </AppShell>
  );
}
