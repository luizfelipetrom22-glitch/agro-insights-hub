import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/agro/AppShell";
import { PremiumSimulation } from "@/components/agro/PremiumSimulation";
import { InsightAndNews } from "@/components/agro/InsightAndNews";
import { HistoricalComparison } from "@/components/agro/HistoricalComparison";
import { OnboardingTour } from "@/components/agro/OnboardingTour";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel Geral — TerraIntelligence" },
      {
        name: "description",
        content:
          "Visão geral do mercado agrícola: cotações, clima, IA, notícias e comparação histórica.",
      },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const tour = useOnboardingTour();

  return (
    <AppShell onHelp={tour.start}>
      <PremiumSimulation />
      <InsightAndNews />
      <HistoricalComparison />
      <OnboardingTour tour={tour} />
    </AppShell>
  );
}
