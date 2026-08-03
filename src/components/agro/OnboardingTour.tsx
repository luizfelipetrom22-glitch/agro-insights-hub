import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  TOUR_STEPS,
  useOnboardingTour,
  type TourStep,
} from "@/hooks/use-onboarding-tour";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
};

const GAP = 16;

export function OnboardingTour() {
  const tour = useOnboardingTour();
  const { active, step } = tour;
  const current = TOUR_STEPS[step];

  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Recompute spotlight + tooltip position whenever step changes or on scroll/resize.
  useLayoutEffect(() => {
    if (!active) return;
    let raf = 0;

    const compute = () => {
      const el = document.querySelector<HTMLElement>(
        current?.selector ?? "",
      );
      if (!el) {
        setRect(null);
        setTooltipPos(null);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });

      const r = el.getBoundingClientRect();
      const next: Rect = {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      };
      setRect(next);

      // Position tooltip relative to spotlight.
      const tip = tooltipRef.current?.getBoundingClientRect();
      const tipW = tip?.width ?? 320;
      const tipH = tip?.height ?? 180;
      let top = next.top;
      let left = next.left;

      switch (current?.placement) {
        case "top":
          top = next.top - tipH - GAP;
          left = next.left + next.width / 2 - tipW / 2;
          break;
        case "bottom":
          top = next.bottom + GAP;
          left = next.left + next.width / 2 - tipW / 2;
          break;
        case "right":
          top = next.top + next.height / 2 - tipH / 2;
          left = next.right + GAP;
          break;
        case "left":
          top = next.top + next.height / 2 - tipH / 2;
          left = next.left - tipW - GAP;
          break;
      }

      // Clamp into viewport.
      const margin = 12;
      top = Math.max(margin, Math.min(top, window.innerHeight - tipH - margin));
      left = Math.max(margin, Math.min(left, window.innerWidth - tipW - margin));
      setTooltipPos({ top, left });
    };

    raf = requestAnimationFrame(compute);

    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [active, step, current]);

  // Esc to dismiss.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tour.dismiss();
      if (e.key === "ArrowRight") tour.next();
      if (e.key === "ArrowLeft") tour.prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, tour]);

  if (!active || !current) return null;

  const isLast = step === TOUR_STEPS.length - 1;

  const spotlightStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: rect.top - GAP,
        left: rect.left - GAP,
        width: rect.width + GAP * 2,
        height: rect.height + GAP * 2,
        borderRadius: 16,
        boxShadow: "0 0 0 9999vmax rgba(15, 23, 18, 0.65)",
        transition: "all 0.25s ease",
        zIndex: 60,
        pointerEvents: "none",
      }
    : { display: "none" };

  return (
    <div aria-live="polite">
      {/* Spotlight */}
      <div style={spotlightStyle} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-label={current.title}
        style={{
          position: "fixed",
          top: tooltipPos?.top ?? -9999,
          left: tooltipPos?.left ?? -9999,
          zIndex: 61,
          maxWidth: 320,
          width: 320,
          transition: "top 0.25s ease, left 0.25s ease",
        }}
        className="rounded-2xl border border-soil-brown/10 bg-card p-5 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="rounded-full bg-harvest-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-harvest-green">
            {step + 1} de {TOUR_STEPS.length}
          </span>
          <button
            onClick={tour.skip}
            aria-label="Pular tour"
            className="text-soil-brown/40 transition-colors hover:text-soil-brown"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <h3 className="mb-2 font-serif text-xl text-soil-brown">
          {current.title}
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-soil-brown/70">
          {current.description}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={tour.prev}
            disabled={step === 0}
            className="text-xs font-semibold text-soil-brown/50 transition-colors enabled:hover:text-soil-brown disabled:opacity-30"
          >
            Voltar
          </button>
          <div className="flex gap-2">
            <button
              onClick={tour.skip}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-soil-brown/60 transition-colors hover:bg-soil-brown/5"
            >
              Pular tour
            </button>
            <button
              onClick={tour.next}
              className="rounded-lg bg-harvest-green px-4 py-2 text-xs font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90"
            >
              {isLast ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>

        {/* progress dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-5 bg-harvest-green"
                  : "w-1.5 bg-soil-brown/15"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
