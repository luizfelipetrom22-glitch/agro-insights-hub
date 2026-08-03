import harvester from "@/assets/harvester.jpg";

const metrics = [
  { label: "Custo Est. / ha", value: "R$ 4.820", accent: false },
  { label: "Break-even", value: "58 sc/ha", accent: false },
  { label: "Margem Líq.", value: "22.4%", accent: true },
  { label: "ROI Previsto", value: "1.8x", accent: false },
];

export function PremiumSimulation() {
  return (
    <section
      id="premium"
      data-tour="premium"
      className="relative overflow-hidden rounded-3xl bg-soil-brown p-8 text-soil-brown-foreground"
    >
      <div className="relative z-10 max-w-xl">
        <span className="mb-6 inline-block rounded-full bg-clay px-3 py-1 text-xs font-bold uppercase tracking-wider text-clay-foreground">
          Recurso Premium
        </span>
        <h2 className="mb-4 font-serif text-4xl">
          Previsão de Custos &amp; Lucratividade da Safra 24/25
        </h2>
        <p className="mb-8 text-soil-brown-foreground/70">
          Simule diferentes cenários de câmbio e preços de insumos para traçar sua melhor
          estratégia de comercialização.
        </p>
        <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="mb-1 text-xs uppercase tracking-widest text-soil-brown-foreground/40">
                {m.label}
              </p>
              <p
                className={`font-serif text-2xl leading-tight ${m.accent ? "text-gain" : ""}`}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-card px-6 py-3 font-semibold text-soil-brown transition-all hover:bg-clay hover:text-clay-foreground">
            Configurar Simulação
          </button>
          <button className="rounded-lg border border-soil-brown-foreground/20 bg-soil-brown-foreground/10 px-6 py-3 font-semibold transition-all hover:bg-soil-brown-foreground/20">
            Exportar PDF
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-20 brightness-150 grayscale">
        <img
          src={harvester}
          alt="Colheitadeira em lavoura dourada"
          width={800}
          height={1200}
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
}