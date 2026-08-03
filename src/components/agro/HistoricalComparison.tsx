const columns = [
  { label: "Mês", value: "Janeiro", tone: "" },
  { label: "Preço Méd.", value: "R$ 114,20", tone: "" },
  { label: "Insumos", value: "- R$ 42,00", tone: "" },
  { label: "Variação", value: "+12%", tone: "text-gain" },
];

export function HistoricalComparison() {
  return (
    <section className="rounded-2xl border border-soil-brown/10 bg-card p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-xl">Comparação Histórica</h3>
          <p className="text-sm text-soil-brown/50">Produtividade e rentabilidade acumulada</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-soil-brown/5 px-4 py-2 text-xs font-semibold">
            Safra 22/23
          </button>
          <button className="rounded-full bg-harvest-green px-4 py-2 text-xs font-semibold text-harvest-green-foreground">
            Safra 23/24
          </button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4 border-t border-soil-brown/5 pt-8 text-center">
        {columns.map((c) => (
          <div key={c.label} className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-soil-brown/40">{c.label}</p>
            <p className={`font-medium ${c.tone}`}>{c.value}</p>
          </div>
        ))}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-soil-brown/40">Status</p>
          <span className="inline-block rounded bg-gain/15 px-2 py-0.5 text-[10px] text-gain">
            Otimista
          </span>
        </div>
      </div>
    </section>
  );
}