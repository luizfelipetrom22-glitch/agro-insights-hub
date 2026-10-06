import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileDown, FileSpreadsheet, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { PremiumNotice } from "@/components/agro/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { usePlan } from "@/hooks/use-plan";
import { useProducerSeason, seasonCompleteness } from "@/hooks/use-producer-season";
import { useTickers } from "@/hooks/use-market";
import { buildProfitRadar, scenarioInputFromRow, seasonFinancialBase, simulateScenario } from "@/lib/profit";
import { generateSeasonReport } from "@/lib/reports.functions";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios da Safra com IA — TerraIntelligence" },
      { name: "description", content: "Relatórios gerados por IA a partir dos dados reais da sua safra, com exportação em PDF e Excel." },
      { property: "og:title", content: "Relatórios da Safra — TerraIntelligence" },
      { property: "og:description", content: "Sua safra analisada por IA, sem números inventados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { data: session } = useProfile();
  const userId = session?.userId ?? "";
  const { isPremium } = usePlan();
  const season = useProducerSeason(session?.userId);
  const tickers = useTickers();
  const qc = useQueryClient();
  const generate = useServerFn(generateSeasonReport);
  const [openId, setOpenId] = useState<string | null>(null);

  const readiness = seasonCompleteness(season.data);
  const base = seasonFinancialBase(season.data);
  const crop = season.data?.crop ?? "";
  const ticker = (tickers.data?.tickers ?? []).find((t) => t.label === crop);
  const radar = base && readiness.complete && ticker?.numeric
    ? buildProfitRadar(base, { price: ticker.numeric, changePct: ticker.changePct })
    : null;

  const reports = useQuery({
    queryKey: ["reports", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const scenarios = useQuery({
    queryKey: ["scenarios", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("simulations").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const scenarioRows = (scenarios.data ?? []).slice(0, 10).map((row) => {
    const input = scenarioInputFromRow(row);
    const r = simulateScenario(input);
    return { name: row.name ?? "Cenário", price: input.pricePerBag, result: r.profit, marginPct: r.marginPct, area: input.areaHectares, yieldHa: input.yieldBagsHa, costHa: r.costPerHa };
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!base || !season.data) throw new Error("Complete sua safra primeiro.");
      return generate({
        data: {
          context: {
            crop,
            seasonName: season.data.season_name ?? "",
            areaHectares: base.area,
            productivityBagsHa: base.productivity,
            costPerHa: base.costPerHa,
            totalCost: base.totalCost,
            production: base.production,
            costPerBag: base.costPerBag,
            targetMarginPct: base.margin,
            targetPrice: base.targetPrice,
            costBreakdown: base.breakdown.map((b) => ({ label: b.label, perHa: b.perHa, share: b.share })),
            market: radar && ticker?.numeric
              ? { price: radar.price, changePct: ticker.changePct ?? null, hint: ticker.hint ?? "Referência de bolsa convertida", revenue: radar.revenue, result: radar.result, marginPct: radar.marginPct, marginPerBag: radar.marginPerBag }
              : null,
          },
          scenarios: scenarioRows.map(({ name, price, result, marginPct }) => ({ name: name.slice(0, 120), price, result, marginPct })),
        },
      });
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["reports", userId] });
      setOpenId(row.id);
      toast.success("Relatório gerado e salvo.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível gerar o relatório."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reports", userId] }),
    onError: () => toast.error("Não foi possível excluir."),
  });

  async function exportPdf(title: string, content: string, date: string) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 50;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;
    doc.setFont("helvetica", "bold").setFontSize(16).text(title, margin, y);
    y += 20;
    doc.setFont("helvetica", "normal").setFontSize(9).text(`TerraIntelligence · ${date} · Gerado por IA com os dados da sua safra`, margin, y);
    y += 24;
    for (const para of content.split("\n")) {
      const isHeading = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}$/.test(para.trim());
      doc.setFont("helvetica", isHeading ? "bold" : "normal").setFontSize(isHeading ? 12 : 10.5);
      const lines = doc.splitTextToSize(para || " ", width) as string[];
      for (const line of lines) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += isHeading ? 18 : 14;
      }
      y += 4;
    }
    doc.save(`${title.replace(/[^\w\- ]+/g, "").trim() || "relatorio"}.pdf`);
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const safra = base && season.data
      ? [
          ["Safra", season.data.season_name ?? ""], ["Cultura", crop], ["Área (ha)", base.area],
          ["Produtividade (sc/ha)", base.productivity], ["Produção estimada (sc)", base.production],
          ["Custo por ha (R$)", base.costPerHa], ["Custo total (R$)", base.totalCost], ["Custo por saca (R$)", base.costPerBag],
          ["Margem desejada (%)", base.margin], ["Preço para a margem (R$/sc)", base.targetPrice],
          [], ["Grupo de custo", "R$/ha", "% do custo"],
          ...base.breakdown.map((b) => [b.label, b.perHa, Math.round(b.share)]),
        ]
      : [["Safra ainda não cadastrada"]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(safra), "Safra");
    const cen = [["Cenário", "Área (ha)", "Produtividade (sc/ha)", "Custo/ha (R$)", "Preço (R$/sc)", "Resultado (R$)", "Margem (%)"],
      ...scenarioRows.map((s) => [s.name, s.area, s.yieldHa, s.costHa, s.price, Math.round(s.result), Number(s.marginPct.toFixed(1))])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cen), "Cenários");
    XLSX.writeFile(wb, "terraintelligence-safra.xlsx");
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl text-harvest-green">Relatórios da safra</h1>
            <p className="mt-1 text-sm text-soil-brown/60">
              Gerados por IA somente com os números da sua safra, dos seus cenários e da referência de mercado.
            </p>
          </div>
          {isPremium && (
            <button onClick={() => void exportExcel()} className="inline-flex items-center gap-2 rounded-lg border border-soil-brown/15 px-4 py-2 text-sm font-semibold text-harvest-green hover:bg-soil-brown/5">
              <FileSpreadsheet className="size-4" aria-hidden /> Exportar safra e cenários (Excel)
            </button>
          )}
        </div>

        {!readiness.complete ? (
          <div className="rounded-2xl border border-dashed border-soil-brown/20 p-6">
            <p className="font-serif text-xl text-soil-brown">Complete sua safra para gerar relatórios</p>
            <p className="mt-1 text-sm text-soil-brown/60">
              O relatório só usa dados reais. Faltam {readiness.total - readiness.done} de {readiness.total} informações.
            </p>
            <Link to="/minha-producao" className="mt-4 inline-block rounded-lg bg-harvest-green px-4 py-2 text-sm font-semibold text-harvest-green-foreground">
              Completar minha safra
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-clay/30 bg-clay/5 p-6">
            <p className="font-serif text-xl text-clay">Gerar relatório da safra</p>
            <p className="mt-1 text-sm text-soil-brown/60">
              Resumo, custos, margem e preço, cenários e recomendações. Leva cerca de um minuto.
            </p>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-clay-foreground hover:bg-clay/90 disabled:opacity-60"
            >
              <Sparkles className="size-4" aria-hidden />
              {create.isPending ? "Gerando relatório…" : "Gerar relatório da safra"}
            </button>
          </div>
        )}

        {!isPremium && (
          <PremiumNotice title="Exportação em PDF e Excel" description="No Premium você baixa cada relatório em PDF e os números da safra e dos cenários em Excel, além de gerar relatórios sem limite." />
        )}

        <div className="space-y-3">
          {(reports.data ?? []).length === 0 && !reports.isLoading && (
            <p className="text-sm text-soil-brown/50">Nenhum relatório salvo ainda.</p>
          )}
          {(reports.data ?? []).map((r) => (
            <article key={r.id} className="rounded-2xl border border-soil-brown/10 bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="text-left">
                  <h3 className="font-serif text-2xl leading-snug">{r.title}</h3>
                  <span className="text-xs text-soil-brown/50">{fmtDate(r.created_at)}</span>
                </button>
                <div className="flex items-center gap-1">
                  {isPremium && (
                    <button onClick={() => void exportPdf(r.title, r.content, fmtDate(r.created_at))} aria-label="Baixar PDF" className="rounded-lg p-2 text-harvest-green hover:bg-soil-brown/5">
                      <FileDown className="size-4" />
                    </button>
                  )}
                  <button onClick={() => remove.mutate(r.id)} aria-label="Excluir relatório" className="rounded-lg p-2 text-soil-brown/50 hover:bg-soil-brown/5">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {openId === r.id && (
                <div className="mt-4 whitespace-pre-line border-t border-soil-brown/10 pt-4 text-sm leading-relaxed text-soil-brown/80">
                  {r.content}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
