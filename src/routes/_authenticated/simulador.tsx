import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, CircleAlert, Pencil, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useTickers } from "@/hooks/use-market";
import { seasonCompleteness, useProducerSeason } from "@/hooks/use-producer-season";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  SCENARIO_COST_LABELS,
  formatMoney,
  formatPrice,
  scenarioInputFromRow,
  scenarioInputFromSeason,
  simulateScenario,
  type ScenarioCosts,
  type ScenarioInput,
} from "@/lib/profit";

type SimuladorSearch = { preco?: number };

export const Route = createFileRoute("/_authenticated/simulador")({
  validateSearch: (search: Record<string, unknown>): SimuladorSearch => {
    const preco = Number(search.preco);
    return Number.isFinite(preco) && preco > 0 ? { preco } : {};
  },
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

const brl = formatMoney;

const DEFAULT_INPUT: ScenarioInput = {
  areaHectares: 100,
  yieldBagsHa: 60,
  pricePerBag: 180,
  targetMarginPct: 20,
  costs: { insumos: 2100, operacao: 900, colheita: 500, frete: 400, terra: 300 },
};

type SavedScenario = Tables<"simulations">;

const scenarioName = (row: SavedScenario) =>
  row.name?.trim() ||
  `${row.crop} · ${new Date(row.created_at).toLocaleDateString("pt-BR")}`;

function SimuladorPage() {
  const { preco } = Route.useSearch();
  const { data: session } = useProfile();
  const season = useProducerSeason(session?.userId);
  const tickers = useTickers();
  const queryClient = useQueryClient();

  const [input, setInput] = useState<ScenarioInput>(DEFAULT_INPUT);
  const hydratedFrom = useRef<"search" | "season" | null>(null);
  const [loadedFromSeason, setLoadedFromSeason] = useState(false);
  const [scenarioNameDraft, setScenarioNameDraft] = useState("");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  // Pré-preenche com a safra cadastrada (uma única vez) e aplica o preço vindo do Radar.
  useEffect(() => {
    if (hydratedFrom.current) return;
    if (preco !== undefined) {
      hydratedFrom.current = "search";
      setInput((prev) => ({ ...prev, pricePerBag: preco }));
      return;
    }
    if (season.data) {
      hydratedFrom.current = "season";
      setInput((prev) => {
        const fromSeason = scenarioInputFromSeason(season.data);
        return { ...fromSeason, pricePerBag: prev.pricePerBag };
      });
      setLoadedFromSeason(true);
    }
  }, [preco, season.data]);

  const readiness = seasonCompleteness(season.data);
  const crop = season.data?.crop ?? "";
  const ticker = (tickers.data?.tickers ?? []).find((item) => item.label === crop);

  const scenariosQuery = useQuery({
    queryKey: ["scenarios", session?.userId ?? ""],
    enabled: Boolean(session?.userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulations")
        .select("*")
        .eq("user_id", session?.userId ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedScenario[];
    },
  });
  const scenarios = scenariosQuery.data ?? [];

  const saveScenario = useMutation({
    mutationFn: async () => {
      const name = scenarioNameDraft.trim();
      if (!name) throw new Error("Dê um nome ao cenário antes de salvar.");
      const { error } = await supabase.from("simulations").insert({
        user_id: session?.userId ?? "",
        name,
        crop: crop || "Simulação",
        area_hectares: input.areaHectares,
        yield_bags_per_ha: input.yieldBagsHa,
        price_per_bag: input.pricePerBag,
        target_margin_pct: input.targetMarginPct,
        input_cost: r.costPerHa,
        seeds_fertilizers_cost_ha: input.costs.insumos,
        operation_cost_ha: input.costs.operacao,
        harvest_cost_ha: input.costs.colheita,
        freight_storage_cost_ha: input.costs.frete,
        land_cost_ha: input.costs.terra,
        result: {
          profit: r.profit,
          marginPct: r.marginPct,
          revenue: r.revenue,
          totalCost: r.totalCost,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cenário salvo.");
      setScenarioNameDraft("");
      void queryClient.invalidateQueries({ queryKey: ["scenarios", session?.userId ?? ""] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar."),
  });

  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simulations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cenário excluído.");
      void queryClient.invalidateQueries({ queryKey: ["scenarios", session?.userId ?? ""] });
    },
    onError: () => toast.error("Não foi possível excluir o cenário."),
  });

  const renameScenario = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("simulations").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cenário renomeado.");
      void queryClient.invalidateQueries({ queryKey: ["scenarios", session?.userId ?? ""] });
    },
    onError: () => toast.error("Não foi possível renomear o cenário."),
  });

  const r = useMemo(() => simulateScenario(input), [input]);

  const setField = (patch: Partial<ScenarioInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const setCost = (key: keyof ScenarioCosts, value: number) =>
    setInput((prev) => ({ ...prev, costs: { ...prev.costs, [key]: value } }));

  const loadScenario = (row: SavedScenario) => {
    hydratedFrom.current = "search";
    setInput(scenarioInputFromRow(row));
    setLoadedFromSeason(false);
    toast.success(`Cenário “${scenarioName(row)}” carregado.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const worthIt = input.pricePerBag >= r.targetPrice;

  const scenarioA = scenarios.find((s) => s.id === compareA);
  const scenarioB = scenarios.find((s) => s.id === compareB);
  const compareResults =
    scenarioA && scenarioB && scenarioA.id !== scenarioB.id
      ? { a: simulateScenario(scenarioInputFromRow(scenarioA)), b: simulateScenario(scenarioInputFromRow(scenarioB)) }
      : null;

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

        {/* Origem dos dados */}
        {season.isLoading ? null : !season.data || !readiness.complete ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-clay/30 bg-clay/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-2xl gap-3">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden />
              <p className="text-sm text-soil-brown/75">
                <strong>Os números abaixo são um exemplo.</strong> Complete sua safra em Minha
                Produção para o simulador partir dos seus dados reais ({readiness.done} de{" "}
                {readiness.total} informados).
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/minha-producao">Completar minha safra</Link>
            </Button>
          </div>
        ) : loadedFromSeason ? (
          <p className="rounded-2xl border border-harvest-green/25 bg-harvest-green/10 px-5 py-3 text-sm text-soil-brown/75">
            Preenchido a partir da sua safra <strong>{season.data.season_name}</strong> (
            {season.data.crop}). Ajuste à vontade — nada aqui altera o cadastro.
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-5 rounded-2xl border border-soil-brown/10 bg-card p-6">
              <h2 className="font-serif text-xl">Sua safra</h2>
              <Field
                label="Área plantada (ha)"
                value={input.areaHectares}
                onChange={(v) => setField({ areaHectares: v })}
                min={1}
                step={1}
              />
              <Field
                label="Produtividade (sacas/ha)"
                value={input.yieldBagsHa}
                onChange={(v) => setField({ yieldBagsHa: v })}
                min={1}
                step={1}
              />
              <Field
                label="Preço de venda (R$/saca)"
                value={input.pricePerBag}
                onChange={(v) => setField({ pricePerBag: v })}
                min={0}
                step={5}
              />
              {ticker?.numeric ? (
                <div className="rounded-xl border border-soil-brown/10 bg-soil-brown/5 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-soil-brown/65">
                      Referência atual de {crop}: <strong>{formatPrice(ticker.numeric)}/sc</strong>
                      <span className="block text-[11px] text-soil-brown/45">
                        {ticker.hint ?? "Referência de bolsa convertida"} — não é preço local de balcão.
                      </span>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setField({ pricePerBag: Math.round(ticker.numeric! * 100) / 100 })}
                    >
                      Usar referência
                    </Button>
                  </div>
                </div>
              ) : crop ? (
                <p className="text-[11px] text-soil-brown/45">
                  Sem cotação de referência para {crop} hoje — informe o preço manualmente.
                </p>
              ) : null}
              <Field
                label="Margem desejada (%)"
                value={input.targetMarginPct}
                onChange={(v) => setField({ targetMarginPct: v })}
                min={0}
                step={1}
              />
            </div>

            <div className="space-y-5 rounded-2xl border border-soil-brown/10 bg-card p-6">
              <div>
                <h2 className="font-serif text-xl">Custos por hectare</h2>
                <p className="text-xs text-soil-brown/50">
                  Total: {brl(r.costPerHa)}/ha — {formatPrice(r.costPerBag)} por saca
                </p>
              </div>
              {(Object.keys(SCENARIO_COST_LABELS) as (keyof ScenarioCosts)[]).map((k) => (
                <Field
                  key={k}
                  label={SCENARIO_COST_LABELS[k]}
                  value={input.costs[k]}
                  onChange={(v) => setCost(k, v)}
                  min={0}
                  step={50}
                />
              ))}
            </div>

            {/* Salvar cenário */}
            <div className="space-y-3 rounded-2xl border border-soil-brown/10 bg-card p-6">
              <h2 className="font-serif text-xl">Salvar este cenário</h2>
              <p className="text-xs text-soil-brown/50">
                Guarde esta simulação com um nome (ex.: “Vender em março”) para comparar depois.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={scenarioNameDraft}
                  onChange={(e) => setScenarioNameDraft(e.target.value)}
                  placeholder="Nome do cenário"
                  maxLength={80}
                  className="w-full rounded-lg border border-soil-brown/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-harvest-green"
                />
                <Button
                  type="button"
                  onClick={() => saveScenario.mutate()}
                  disabled={saveScenario.isPending || !scenarioNameDraft.trim()}
                >
                  <Save aria-hidden /> Salvar
                </Button>
              </div>
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
                {formatPrice(r.targetPrice)} / saca
              </p>
              <p className="mt-2 text-sm text-soil-brown/70">
                Abaixo de <strong>{formatPrice(r.costPerBag)}</strong> por saca você vende no
                prejuízo. Para fechar com {input.targetMarginPct}% de margem, precisa de{" "}
                {formatPrice(r.targetPrice)}.{" "}
                {worthIt
                  ? "O preço atual atende sua meta."
                  : `Faltam ${formatPrice(Math.max(0, r.targetPrice - input.pricePerBag))} por saca para atingir a meta.`}
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
                value={`${r.marginPct.toFixed(1)}%`}
                tone={r.marginPct >= input.targetMarginPct ? "gain" : "loss"}
              />
              <Stat
                label="Ganho por saca"
                value={formatPrice(r.profitPerBag)}
                tone={r.profitPerBag >= 0 ? "gain" : "loss"}
              />
              <Stat
                label="Empate (produtividade)"
                value={`${r.breakEvenSacas.toFixed(1)} sc/ha`}
                tone="muted"
              />
              <Stat label="Custo por saca" value={formatPrice(r.costPerBag)} tone="muted" />
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
                        <td className="py-2">{formatPrice(s.price)}</td>
                        <td
                          className={`py-2 ${s.profit >= 0 ? "text-harvest-green" : "text-clay"}`}
                        >
                          {brl(s.profit)}
                        </td>
                        <td className={`py-2 ${s.delta >= 0 ? "text-gain" : "text-loss"}`}>
                          {s.delta > 0 ? "+" : ""}
                          {brl(s.delta)}
                        </td>
                        <td className="py-2">{s.marginPct.toFixed(1)}%</td>
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
                      <span className="text-soil-brown/80">{SCENARIO_COST_LABELS[b.key]}</span>
                      <span className="whitespace-nowrap font-semibold">
                        {formatPrice(b.perBag)}/saca · {b.share.toFixed(0)}%
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
                  Maior peso: <strong>{SCENARIO_COST_LABELS[r.breakdown[0].key]}</strong>. Reduzir
                  10% aqui devolve {brl(input.areaHectares * r.breakdown[0].value * 0.1)} ao seu
                  bolso na safra inteira.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cenários salvos */}
        <section className="space-y-5 rounded-2xl border border-soil-brown/10 bg-card p-6">
          <div>
            <h2 className="font-serif text-2xl text-harvest-green">Cenários salvos</h2>
            <p className="mt-1 text-sm text-soil-brown/60">
              Reabra, compare e descarte simulações anteriores.
            </p>
          </div>

          {scenariosQuery.isLoading ? (
            <p className="text-sm text-soil-brown/50">Carregando cenários…</p>
          ) : scenarios.length === 0 ? (
            <p className="rounded-xl border border-dashed border-soil-brown/20 px-5 py-6 text-sm text-soil-brown/55">
              Nenhum cenário salvo ainda. Ajuste os números acima e clique em{" "}
              <strong>Salvar</strong> para começar a comparar decisões.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-soil-brown/10">
                {scenarios.map((row) => {
                  const result = simulateScenario(scenarioInputFromRow(row));
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-soil-brown">{scenarioName(row)}</p>
                        <p className="mt-0.5 text-xs text-soil-brown/55">
                          {formatPrice(Number(row.price_per_bag))}/saca · lucro{" "}
                          <span className={result.profit >= 0 ? "text-gain" : "text-loss"}>
                            {brl(result.profit)}
                          </span>{" "}
                          · margem {result.marginPct.toFixed(1)}% ·{" "}
                          {new Date(row.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => loadScenario(row)}>
                          <Upload aria-hidden /> Abrir
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const name = window.prompt("Novo nome do cenário:", scenarioName(row));
                            if (name?.trim()) renameScenario.mutate({ id: row.id, name: name.trim() });
                          }}
                        >
                          <Pencil aria-hidden /> Renomear
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Excluir o cenário “${scenarioName(row)}”?`)) {
                              deleteScenario.mutate(row.id);
                            }
                          }}
                        >
                          <Trash2 aria-hidden /> Excluir
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Comparação lado a lado */}
              <div className="space-y-4 border-t border-soil-brown/10 pt-5">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight className="size-5 text-clay" aria-hidden />
                  <h3 className="font-serif text-xl">Comparar dois cenários</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["Cenário A", compareA, setCompareA],
                      ["Cenário B", compareB, setCompareB],
                    ] as const
                  ).map(([label, value, setter]) => (
                    <label key={label} className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
                        {label}
                      </span>
                      <select
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full rounded-lg border border-soil-brown/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-harvest-green"
                      >
                        <option value="">Escolher cenário…</option>
                        {scenarios.map((row) => (
                          <option key={row.id} value={row.id}>
                            {scenarioName(row)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {scenarioA && scenarioB && scenarioA.id === scenarioB.id ? (
                  <p className="text-sm text-clay">Escolha dois cenários diferentes para comparar.</p>
                ) : compareResults && scenarioA && scenarioB ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-soil-brown/40">
                          <th className="pb-2"> </th>
                          <th className="pb-2">{scenarioName(scenarioA)}</th>
                          <th className="pb-2">{scenarioName(scenarioB)}</th>
                          <th className="pb-2">Diferença (B − A)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow
                          label="Preço de venda"
                          a={formatPrice(Number(scenarioA.price_per_bag))}
                          b={formatPrice(Number(scenarioB.price_per_bag))}
                        />
                        <CompareRow
                          label="Produção"
                          a={`${compareResults.a.production.toLocaleString("pt-BR")} sc`}
                          b={`${compareResults.b.production.toLocaleString("pt-BR")} sc`}
                        />
                        <CompareRow label="Receita" a={brl(compareResults.a.revenue)} b={brl(compareResults.b.revenue)} />
                        <CompareRow label="Custo total" a={brl(compareResults.a.totalCost)} b={brl(compareResults.b.totalCost)} />
                        <CompareRow
                          label="Lucro"
                          a={brl(compareResults.a.profit)}
                          b={brl(compareResults.b.profit)}
                          delta={compareResults.b.profit - compareResults.a.profit}
                          money
                        />
                        <CompareRow
                          label="Margem"
                          a={`${compareResults.a.marginPct.toFixed(1)}%`}
                          b={`${compareResults.b.marginPct.toFixed(1)}%`}
                        />
                        <CompareRow
                          label="Ponto de equilíbrio"
                          a={`${formatPrice(compareResults.a.costPerBag)}/sc`}
                          b={`${formatPrice(compareResults.b.costPerBag)}/sc`}
                        />
                      </tbody>
                    </table>
                    <p
                      className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                        compareResults.b.profit >= compareResults.a.profit
                          ? "bg-harvest-green/10 text-harvest-green"
                          : "bg-clay/10 text-clay"
                      }`}
                    >
                      {compareResults.b.profit >= compareResults.a.profit
                        ? `“${scenarioName(scenarioB)}” rende ${brl(compareResults.b.profit - compareResults.a.profit)} a mais que “${scenarioName(scenarioA)}”.`
                        : `“${scenarioName(scenarioB)}” rende ${brl(compareResults.a.profit - compareResults.b.profit)} a menos que “${scenarioName(scenarioA)}”.`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-soil-brown/50">
                    Selecione os dois cenários para ver a diferença em reais.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function CompareRow({
  label,
  a,
  b,
  delta,
  money = false,
}: {
  label: string;
  a: string;
  b: string;
  delta?: number;
  money?: boolean;
}) {
  return (
    <tr className="border-t border-soil-brown/10">
      <td className="py-2 text-soil-brown/60">{label}</td>
      <td className="py-2">{a}</td>
      <td className="py-2">{b}</td>
      <td className="py-2">
        {money && delta !== undefined ? (
          <span className={delta >= 0 ? "font-semibold text-gain" : "font-semibold text-loss"}>
            {delta >= 0 ? "+" : "−"}
            {brl(Math.abs(delta))}
          </span>
        ) : (
          <span className="text-soil-brown/30">—</span>
        )}
      </td>
    </tr>
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
