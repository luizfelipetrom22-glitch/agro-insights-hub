import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/agro/AppShell";

export const Route = createFileRoute("/_authenticated/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador de Lucro — TerraIntelligence" },
      {
        name: "description",
        content:
          "Simule o lucro da safra: produtividade, preço, custos de insumos e dólar.",
      },
    ],
  }),
  component: SimuladorPage,
});

function SimuladorPage() {
  const [area, setArea] = useState(100);
  const [prod, setProd] = useState(60); // sacas/ha
  const [price, setPrice] = useState(180); // R$ / saca
  const [cost, setCost] = useState(4200); // R$ / ha

  const production = area * prod;
  const revenue = production * price;
  const totalCost = area * cost;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <span className="rounded bg-clay px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-clay-foreground">
            Premium
          </span>
          <h1 className="mt-2 font-serif text-4xl text-harvest-green">Simulador de Lucro</h1>
          <p className="mt-1 text-sm text-soil-brown/60">
            Ajuste as variáveis e veja o impacto na margem da sua safra.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6 rounded-2xl border border-soil-brown/10 bg-card p-6">
            <Field label="Área plantada (ha)" value={area} onChange={setArea} min={1} step={1} />
            <Field label="Produtividade (sacas/ha)" value={prod} onChange={setProd} min={1} step={1} />
            <Field label="Preço de venda (R$/saca)" value={price} onChange={setPrice} min={1} step={5} />
            <Field label="Custo total (R$/ha)" value={cost} onChange={setCost} min={0} step={100} />
          </div>

          {/* Results */}
          <div className="space-y-4">
            <Stat label="Produção estimada" value={`${production.toLocaleString("pt-BR")} sacas`} />
            <Stat label="Receita bruta" value={`R$ ${revenue.toLocaleString("pt-BR")}`} />
            <Stat label="Custo total" value={`R$ ${totalCost.toLocaleString("pt-BR")}`} tone="muted" />
            <div
              className={`rounded-2xl border p-6 ${
                profit >= 0
                  ? "border-harvest-green/30 bg-harvest-green/10"
                  : "border-clay/30 bg-clay/10"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-soil-brown/50">
                Lucro líquido
              </p>
              <p
                className={`mt-1 font-serif text-4xl ${
                  profit >= 0 ? "text-harvest-green" : "text-clay"
                }`}
              >
                R$ {profit.toLocaleString("pt-BR")}
              </p>
              <p className="mt-2 text-sm text-soil-brown/60">
                Margem de {margin.toFixed(1)}% sobre a receita.
              </p>
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
  tone?: "default" | "muted";
}) {
  return (
    <div className="rounded-xl border border-soil-brown/10 bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-soil-brown/50">{label}</p>
      <p
        className={`mt-1 font-serif text-2xl ${
          tone === "muted" ? "text-soil-brown/60" : "text-soil-brown"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
