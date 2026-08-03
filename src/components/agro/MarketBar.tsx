const tickers = [
  { label: "Soja (CBOT)", value: "US$ 11,84", change: "+0.4%", dir: "up" as const },
  { label: "Milho", value: "R$ 62,50", change: "-1.2%", dir: "down" as const },
  { label: "Boi Gordo", value: "R$ 238,40", change: "+1.2%", dir: "up" as const },
  { label: "Café Arábica", value: "R$ 1.120,00", change: "0.0%", dir: "flat" as const },
  { label: "Dólar", value: "R$ 4,96", change: null, dir: "flat" as const },
  { label: "Clima (MT)", value: "28°C Sol", change: null, dir: "flat" as const },
];

export function MarketBar({ onHelp }: { onHelp?: () => void }) {
  return (
    <div
      data-tour="market-bar"
      className="sticky top-0 z-50 flex items-center justify-between border-b border-harvest-green-foreground/10 bg-harvest-green px-6 py-2.5 text-xs font-medium text-harvest-green-foreground"
    >
      <div className="flex gap-8 overflow-x-auto">
        {tickers.map((t) => (
          <div key={t.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="uppercase tracking-wider opacity-60">{t.label}</span>
            <span
              className={
                t.dir === "up"
                  ? "font-semibold text-gain"
                  : t.dir === "down"
                    ? "font-semibold text-loss"
                    : "font-semibold"
              }
            >
              {t.value}
            </span>
            {t.change && (
              <span
                className={`rounded px-1 text-[10px] ${
                  t.dir === "up"
                    ? "bg-gain/20"
                    : t.dir === "down"
                      ? "bg-loss/20"
                      : "bg-harvest-green-foreground/10"
                }`}
              >
                {t.change}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="hidden shrink-0 items-center gap-4 pl-6 md:flex">
        <span className="whitespace-nowrap opacity-60">12 Mar, 2024</span>
        <div className="h-4 w-px bg-harvest-green-foreground/20" />
        <button
          onClick={onHelp}
          className="transition-colors hover:text-clay"
        >
          Ajuda
        </button>
      </div>
    </div>
  );
}