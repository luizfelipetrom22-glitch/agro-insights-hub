import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/agro/AppShell";

export const Route = createFileRoute("/_authenticated/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador de Lucro — TerraIntelligence" },
      {
        name: "description",
        content:
          "Simule a margem da safra: preço mínimo que vale a pena, ganho ou perda a cada variação de preço e onde o custo está pesando mais.",
      },
      { property: "og:title", content: "Simulador de Lucro — TerraIntelligence" },
      {
        property: "og:description",
        content:
          "Descubra o preço mínimo que compensa vender, o impacto de cada variação de preço e onde você está perdendo dinheiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimuladorPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type CostKey = "insumos" | "operacao" | "colheita" | "frete" | "terra";

const COST_LABELS: Record<CostKey, string> = {
  insumos: "Insumos (semente, adubo, defensivo)",
  operacao: "Operação (máquinas, diesel, mão de obra)",
  colheita: "Colheita e secagem",
  frete: "Frete e armazenagem",
  terra: "Arrendamento / custo da terra",
};

function SimuladorPage() {
  const [area, setArea] = useState(100);
  const [prod, setProd] = useState(60); // sacas/ha
  const [price, setPrice] = useState(180); // R$ / saca
  const [margemAlvo, setMargemAlvo] = useState(20); // % desejada
  const [costs, setCosts] = useState<Record<CostKey, number>>({
    insumos: 2100,
    operacao: 900,
    colheita: 500,
    frete: 400,
    terra: 300,
  });

  const setCost = (key: CostKey, v: number) => setCosts((c) => ({ ...c, [key]: v }));

  const r = useMemo(() => {
    const costPerHa = (Object.values(costs) as number[]).reduce((a, b) => a + b, 0);
    const production = area * prod;
    const revenue = production * price;
    const totalCost = area * costPerHa;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const costPerSaca = prod > 0 ? costPerHa / prod : 0; // preço de equilíbrio
    const targetPrice = margemAlvo < 100 ? costPerSaca / (1 - margemAlvo / 100) : 0;
    const breakEvenSacas = price > 0 ? costPerHa / price : 0; // sacas/ha p/ empatar
    const profitPerSaca = price - costPerSaca;
    const sensitivity = [-15, -10, -5, 0, 5, 10, 15].map((pct) => {
      const p = price * (1 + pct / 100);
      const rev = production * p;
      const prof = rev - totalCost;
      return {
        pct,
        price: p,
        profit: prof,
        delta: prof - profit,
        margin: rev > 0 ? (prof / rev) * 100 : 0,
      };
    });
    const breakdown = (Object.keys(costs) as CostKey[])
      .map((k) => ({
        key: k,
        value: costs[k],
        share: costPerHa > 0 ? (costs[k] / costPerHa) * 100 : 0,
        perSaca: prod > 0 ? costs[k] / prod : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return {
      costPerHa,
      production,
      revenue,
      totalCost,
      profit,
      margin,
      costPerSaca,
      targetPrice,
      breakEvenSacas,
      profitPerSaca,
      sensitivity,
      breakdown,
    };
  }, [area, prod, price, margemAlvo, costs]);

  const worthIt = price >= r.targetPrice;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <span className="rounded bg-clay px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-clay-foreground">
            Premium
          </span>
          <h1 className="mt-2 font-serif text-4xl text-harvest-green">Simulador de Lucro</h1>
          <p className="mt-1 text-sm text-soil-brown/60">
            Veja a margem real, o preço que vale a pena e onde o dinheiro está indo embora.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-5 rounded-2xl border border-soil-brown/10 bg-card p-6">
              <h2 className="font-serif text-xl">Sua safra</h2>
              <Field label="Área plantada (ha)" value={area} onChange={setArea} min={1} step={1} />
              <Field label="Produtividade (sacas/ha)" value={prod} onChange={setProd} min={1} step={1} />
              <Field label="Preço de venda (R$/saca)" value={price} onChange={setPrice} min={0} step={5} />
              <Field
                label="Margem desejada (%)"
                value={margemAlvo}
                onChange={setMargemAlvo}
                min={0}
                step={1}
              />
            </div>

            <div className="space-y-5 rounded-2xl border border-soil-brown/10 bg-card p-6">
              <div>
                <h2 className="font-serif text-xl">Custos por hectare</h2>
                <p className="text-xs text-soil-brown/50">
                  Total: {brl(r.costPerHa)}/ha — {brl(r.costPerSaca)} por saca
                </p>
              </div>
              {(Object.keys(COST_LABELS) as CostKey[]).map((k) => (
                <Field
                  key={k}
                  label={COST_LABELS[k]}
                  value={costs[k]}
                  onChange={(v) => setCost(k, v)}
                  min={0}
                  step={50}
                />
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div
              className={`rounded-2xl border p-6 ${
                worthIt
                  ? "border-harvest-green/30 bg-harvest-green/10"
                  : "border-clay/30 bg-clay/10"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-soil-brown/50">
                Preço que vale a pena
              </p>
              <p
                className={`mt-1 font-serif text-4xl ${
                  worthIt ? "text-harvest-green" : "text-clay"
                }`}
              >
                {brl(r.targetPrice)} / saca
              </p>
              <p className="mt-2 text-sm text-soil-brown/70">
                Abaixo de <strong>{brl(r.costPerSaca)}</strong> por saca você vende no prejuízo. Para
                fechar com {margemAlvo}% de margem, precisa de {brl(r.targetPrice)}.{" "}
                {worthIt
                  ? "O preço atual atende sua meta."
                  : `Faltam ${brl(Math.max(0, r.targetPrice - price))} por saca para atingir a meta.`}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Stat label="Produção estimada" value={`${r.production.toLocaleString("pt-BR")} sacas`} />
              <Stat label="Receita bruta" value={brl(r.revenue)} />
              <Stat label="Custo total" value={brl(r.totalCost)} tone="muted" />
              <Stat
                label="Lucro líquido"
                value={brl(r.profit)}
                tone={r.profit >= 0 ? "gain" : "loss"}
              />
              <Stat
                label="Margem"
                value={`${r.margin.toFixed(1)}%`}
                tone={r.margin >= margemAlvo ? "gain" : "loss"}
              />
              <Stat
                label="Ganho por saca"
                value={brl(r.profitPerSaca)}
                tone={r.profitPerSaca >= 0 ? "gain" : "loss"}
              />
              <Stat
                label="Empate (produtividade)"
                value={`${r.breakEvenSacas.toFixed(1)} sc/ha`}
                tone="muted"
              />
              <Stat label="Custo por saca" value={brl(r.costPerSaca)} tone="muted" />
            </div>

            {/* Sensibilidade */}
            <div className="rounded-2xl border border-soil-brown/10 bg-card p-6">
              <h2 className="font-serif text-xl">Se o preço mudar</h2>
              <p className="mb-4 text-xs text-soil-brown/50">
                Quanto você ganha ou perde a cada variação no preço da saca.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-soil-brown/40">
                      <th className="pb-2">Variação</th>
                      <th className="pb-2">Preço</th>
                      <th className="pb-2">Lucro</th>
                      <th className="pb-2">Diferença</th>
                      <th className="pb-2">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.sensitivity.map((s) => (
                      <tr
                        key={s.pct}
                        className={`border-t border-soil-brown/10 ${
                          s.pct === 0 ? "bg-soil-brown/5 font-semibold" : ""
                        }`}
                      >
                        <td className="py-2">
                          {s.pct > 0 ? "+" : ""}
                          {s.pct}%
                        </td>
                        <td className="py-2">{brl(s.price)}</td>
                        <td
                          className={`py-2 ${s.profit >= 0 ? "text-harvest-green" : "text-clay"}`}
                        >
                          {brl(s.profit)}
                        </td>
                        <td className={`py-2 ${s.delta >= 0 ? "text-gain" : "text-loss"}`}>
                          {s.delta > 0 ? "+" : ""}
                          {brl(s.delta)}
                        </td>
                        <td className="py-2">{s.margin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Onde está perdendo dinheiro */}
            <div className="rounded-2xl border border-soil-brown/10 bg-card p-6">
              <h2 className="font-serif text-xl">Onde o dinheiro está indo</h2>
              <p className="mb-4 text-xs text-soil-brown/50">
                Do maior para o menor peso no custo de cada saca.
              </p>
              <ul className="space-y-3">
                {r.breakdown.map((b) => (
                  <li key={b.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-soil-brown/80">{COST_LABELS[b.key]}</span>
                      <span className="whitespace-nowrap font-semibold">
                        {brl(b.perSaca)}/saca · {b.share.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-soil-brown/10">
                      <div
                        className="h-2 rounded-full bg-harvest-green"
                        style={{ width: `${Math.min(100, b.share)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              {r.breakdown[0] && (
                <p className="mt-4 rounded-xl border border-clay/30 bg-clay/10 px-3 py-2 text-xs text-soil-brown/80">
                  Maior peso: <strong>{COST_LABELS[r.breakdown[0].key]}</strong>. Reduzir 10% aqui
                  devolve {brl(area * r.breakdown[0].value * 0.1)} ao seu bolso na safra inteira.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  step: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
        {label}
      </label>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-soil-brown/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-harvest-green"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "gain" | "loss";
}) {
  const toneClass =
    tone === "muted"
      ? "text-soil-brown/60"
      : tone === "gain"
        ? "text-harvest-green"
        : tone === "loss"
          ? "text-clay"
          : "text-soil-brown";
  return (
    <div className="rounded-xl border border-soil-brown/10 bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-soil-brown/50">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${toneClass}`}>{value}</p>
    </div>
  );
}
