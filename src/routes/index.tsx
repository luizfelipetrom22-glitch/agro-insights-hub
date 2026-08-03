import { createFileRoute } from "@tanstack/react-router";
import { MarketBar } from "@/components/agro/MarketBar";
import { Sidebar } from "@/components/agro/Sidebar";
import { PremiumSimulation } from "@/components/agro/PremiumSimulation";
import { InsightAndNews } from "@/components/agro/InsightAndNews";
import { HistoricalComparison } from "@/components/agro/HistoricalComparison";
import { OnboardingTour } from "@/components/agro/OnboardingTour";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraIntelligence — Inteligência de mercado para o agro" },
      {
        name: "description",
        content:
          "Preços de commodities, clima, dólar, notícias, calendário agrícola e relatórios de IA em um só painel.",
      },
      { property: "og:title", content: "TerraIntelligence — Inteligência de mercado para o agro" },
      {
        property: "og:description",
        content:
          "Painel com cotações, clima, dólar, notícias do agronegócio e análises geradas por IA.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const tour = useOnboardingTour();

  return (
    <div className="min-h-screen bg-background font-sans text-soil-brown selection:bg-clay/20">
      <MarketBar onHelp={tour.start} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-8 p-8">
        <Sidebar />
        <main className="col-span-12 space-y-8 lg:col-span-9">
          <PremiumSimulation />
          <InsightAndNews />
          <HistoricalComparison />
        </main>
      </div>
      <OnboardingTour tour={tour} />
    </div>
  );
}
