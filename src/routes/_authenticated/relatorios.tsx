import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/agro/AppShell";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios IA — TerraIntelligence" },
      {
        name: "description",
        content:
          "Relatórios de mercado gerados automaticamente por inteligência artificial.",
      },
    ],
  }),
  component: RelatoriosPage,
});

const reports = [
  {
    title: "Panorama Semanal Soja",
    date: "15 Mar, 2026",
    excerpt:
      "Preços internacionais em alta com pressão de demanda chinesa. Acompanhe a janela de venda recomendada.",
    tag: "Soja",
  },
  {
    title: "Custo de Produção — Milho Safrinha",
    date: "10 Mar, 2026",
    excerpt:
      "Análise de insumos e dólar projeta margem apertada. Simulação de cenários incluída.",
    tag: "Milho",
  },
  {
    title: "Clima e Impacto Safra 2026",
    date: "08 Mar, 2026",
    excerpt:
      "La Niña fraca mantém padrão de chuva acima da média no Centro-Sul. Risco para o trigo.",
    tag: "Clima",
  },
];

function RelatoriosPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl text-harvest-green">Relatórios IA</h1>
          <p className="mt-1 text-sm text-soil-brown/60">
            Análises de mercado geradas automaticamente por inteligência artificial.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <article
              key={r.title}
              className="flex flex-col rounded-2xl border border-soil-brown/10 bg-card p-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-harvest-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-harvest-green">
                  {r.tag}
                </span>
                <span className="text-xs text-soil-brown/40">{r.date}</span>
              </div>
              <h3 className="font-serif text-2xl leading-snug">{r.title}</h3>
              <p className="mt-2 flex-1 text-sm text-soil-brown/70">{r.excerpt}</p>
              <button className="mt-4 self-start text-sm font-semibold text-harvest-green underline-offset-2 hover:underline">
                Ler relatório completo →
              </button>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-clay/30 bg-clay/5 p-6 text-center">
          <p className="font-serif text-xl text-clay">Gerar novo relatório</p>
          <p className="mt-1 text-sm text-soil-brown/60">
            Peça à IA um relatório sob medida: cultura, região e período.
          </p>
          <button className="mt-4 rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-clay-foreground transition-colors hover:bg-clay/90">
            Solicitar relatório IA
          </button>
        </div>
      </div>
    </AppShell>
  );
}
