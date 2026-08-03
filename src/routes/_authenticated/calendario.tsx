import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/agro/AppShell";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário Agrícola — TerraIntelligence" },
      {
        name: "description",
        content:
          "Calendário agrícola com janelas de plantio, colheita e eventos de mercado.",
      },
    ],
  }),
  component: CalendarioPage,
});

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const crops = [
  { name: "Soja", plant: ["Set", "Out", "Nov", "Dez"], harvest: ["Jan", "Fev", "Mar", "Abr"] },
  { name: "Milho 1ª", plant: ["Set", "Out", "Nov"], harvest: ["Jan", "Fev", "Mar"] },
  { name: "Milho Safrinha", plant: ["Jan", "Fev", "Mar"], harvest: ["Mai", "Jun", "Jul"] },
  { name: "Café", plant: [], harvest: ["Mai", "Jun", "Jul", "Ago", "Set"] },
];

function CalendarioPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl text-harvest-green">Calendário Agrícola</h1>
          <p className="mt-1 text-sm text-soil-brown/60">
            Janelas de plantio e colheita das principais culturas brasileiras.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-soil-brown/10 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-soil-brown/10 text-xs uppercase tracking-wide text-soil-brown/40">
                <th className="px-4 py-3 text-left">Cultura</th>
                {months.map((m) => (
                  <th key={m} className="px-2 py-3 text-center font-normal">
                    {m.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crops.map((c) => (
                <tr key={c.name} className="border-b border-soil-brown/5 last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  {months.map((m) => {
                    const abbr = m.slice(0, 3);
                    const isPlant = c.plant.includes(abbr);
                    const isHarvest = c.harvest.includes(abbr);
                    return (
                      <td key={m} className="px-2 py-3 text-center">
                        {isPlant && (
                          <span className="inline-block h-6 w-6 rounded-full bg-harvest-green/20 text-[10px] leading-6 text-harvest-green" title="Plantio">
                            P
                          </span>
                        )}
                        {isHarvest && (
                          <span className="inline-block h-6 w-6 rounded-full bg-clay/20 text-[10px] leading-6 text-clay" title="Colheita">
                            C
                          </span>
                        )}
                        {!isPlant && !isHarvest && (
                          <span className="inline-block h-6 w-6" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-6 text-xs text-soil-brown/60">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-harvest-green/30" /> Plantio
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-clay/30" /> Colheita
          </span>
        </div>
      </div>
    </AppShell>
  );
}
