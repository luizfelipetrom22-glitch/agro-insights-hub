import { useCallback, useEffect, useState } from "react";

export type TourStep = {
  selector: string;
  title: string;
  description: string;
  /** where to place the tooltip relative to the highlighted element */
  placement: "top" | "right" | "bottom" | "left";
};

export const TOUR_STEPS: TourStep[] = [
  {
    selector: "[data-tour='decision-overview']",
    title: "Comece pelo contexto da sua safra",
    description:
      "Cadastre sua produção para transformar custos e produtividade em margem, ponto de equilíbrio e decisões.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='profit-radar']",
    title: "Radar de Lucro",
    description:
      "Aqui sua safra é cruzada com a referência de mercado: margem por saca, ponto de equilíbrio, oportunidades e riscos com ação direta.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='sidebar']",
    title: "Quatro passos para decidir melhor",
    description:
      "Use Visão Geral, Minha Produção, Simular Decisão e Análises IA para acompanhar sua rentabilidade.",
    placement: "right",
  },
  {
    selector: "[data-tour='market-bar']",
    title: "Mercado como sinal",
    description:
      "Cotações, dólar e clima continuam atualizados. Eles ganham significado quando cruzados com os dados da sua safra.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='insight-news']",
    title: "Contexto antes da ação",
    description:
      "A análise geral e as notícias ajudam a entender os movimentos que podem afetar suas decisões.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='history']",
    title: "Referência histórica",
    description:
      "Compare a referência de mercado dos últimos 24 meses. Ela não substitui o preço local da sua região.",
    placement: "top",
  },
];

const STORAGE_KEY = "terra-tour-financial-seen";

function hasSeenTour() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function useOnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  const start = useCallback(() => {
    setStep(0);
    setActive(true);
  }, []);

  const next = useCallback(() => {
    setStep((s) => {
      if (s >= TOUR_STEPS.length - 1) {
        setActive(false);
        markTourSeen();
        return s;
      }
      return s + 1;
    });
  }, []);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const dismiss = useCallback(() => {
    setActive(false);
    markTourSeen();
  }, []);

  const skip = dismiss;

  // Auto-start on first visit (after hydration, browser-only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasSeenTour()) return;
    // small delay so the page is painted
    const t = window.setTimeout(start, 600);
    return () => window.clearTimeout(t);
  }, [start]);

  return { active, step, start, next, prev, dismiss, skip };
}
