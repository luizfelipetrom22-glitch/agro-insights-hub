import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/agro/AppShell";
import { PremiumSimulation } from "@/components/agro/PremiumSimulation";
import { InsightAndNews } from "@/components/agro/InsightAndNews";
import { HistoricalComparison } from "@/components/agro/HistoricalComparison";
import { OnboardingTour } from "@/components/agro/OnboardingTour";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { useProfile } from "@/hooks/use-profile";

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
  const { data: session, isLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session && session.userType === "comprador") {
      void navigate({ to: "/comprador" });
    }
  }, [isLoading, session, navigate]);

  return (
    <AppShell onHelp={tour.start}>
      <PremiumSimulation />
      <InsightAndNews />
      <HistoricalComparison />
      <OnboardingTour tour={tour} />
    </AppShell>
  );
}
