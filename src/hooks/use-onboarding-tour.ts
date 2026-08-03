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
    selector: "[data-tour='market-bar']",
    title: "Barra de cotações",
    description:
      "Aqui ficam os preços de soja, milho, boi, café, dólar e clima — sempre atualizados no topo da tela.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='sidebar']",
    title: "Menu de navegação",
    description:
      "Use o menu para trocar entre Painel Geral, Calendário Agrícola, Relatórios IA e o Simulador de Lucro (Premium).",
    placement: "right",
  },
  {
    selector: "[data-tour='premium']",
    title: "Recurso Premium",
    description:
      "Área do plano pago: custo por hectare, break-even, margem líquida e ROI previsto, com simulação e exportação.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='insight-news']",
    title: "Análise IA e Notícias",
    description:
      "À esquerda, relatórios de mercado gerados por IA. À direita, as últimas notícias do agronegócio.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='history']",
    title: "Comparação Histórica",
    description:
      "Compare produtividade e rentabilidade entre safras (22/23 x 23/24) e veja o status do mês.",
    placement: "top",
  },
];

const STORAGE_KEY = "terra-tour-seen";

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
    if (!hasSeenTour()) {
      // small delay so the page is painted
      const t = window.setTimeout(start, 600);
      return () => window.clearTimeout(t);
    }
  }, [start]);

  return { active, step, start, next, prev, dismiss, skip };
}
