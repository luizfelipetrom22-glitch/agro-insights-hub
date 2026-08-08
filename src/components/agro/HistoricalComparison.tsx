import { useState } from "react";
import { HISTORY_PRODUCTS, usePriceHistory, type HistoryProductName } from "@/hooks/use-market";
import { formatBRL } from "@/lib/marketplace";

export function HistoricalComparison() {
  const [product, setProduct] = useState<HistoryProductName>("Soja");
  const { data, isLoading } = usePriceHistory(product);
  const months = data?.months ?? [];
  const last = months[months.length - 1];
  const change = data?.changePct ?? null;
  const tone = change === null ? "" : change > 0 ? "text-gain" : change < 0 ? "text-loss" : "";
  const max = months.length ? Math.max(...months.map((m) => m.price)) : 0;

  return (
    <section
      data-tour="history"
      className="rounded-2xl border border-soil-brown/10 bg-card p-8"
    >
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-xl">Comparação Histórica</h3>
          <p className="text-sm text-soil-brown/50">
            Preços reais dos últimos 24 meses {data?.unit ? `(${data.unit})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {HISTORY_PRODUCTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProduct(p)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                p === product
                  ? "bg-harvest-green text-harvest-green-foreground"
                  : "bg-soil-brown/5"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-soil-brown/50">Carregando histórico…</p>}
      {!isLoading && months.length === 0 && (
        <p className="text-sm text-soil-brown/50">Histórico indisponível no momento.</p>
      )}

      {months.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 border-t border-soil-brown/5 pt-8 text-center md:grid-cols-4">
            <Cell label={`Último mês (${last?.month ?? ""})`} value={formatBRL(last?.price ?? null)} />
            <Cell label="Média 12 meses" value={formatBRL(data?.lastYearAvg ?? null)} />
            <Cell label="Média 12 meses anteriores" value={formatBRL(data?.previousYearAvg ?? null)} />
            <Cell
              label="Variação entre os períodos"
              value={change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1).replace(".", ",")}%`}
              tone={tone}
            />
          </div>

          <div className="mt-8 flex h-32 items-end gap-1">
            {months.map((m, i) => (
              <div
                key={`${m.month}-${i}`}
                title={`${m.month}: ${formatBRL(m.price)}`}
                className="flex-1 rounded-t bg-harvest-green/70"
                style={{ height: `${max ? Math.max(4, (m.price / max) * 100) : 0}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-soil-brown/40">
            <span>{months[0]?.month}</span>
            <span>{last?.month}</span>
          </div>
        </>
      )}
    </section>
  );
}

function Cell({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-soil-brown/40">{label}</p>
      <p className={`font-medium ${tone}`}>{value}</p>
    </div>
  );
}