import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { seasonCompleteness, seasonQueryKey, useProducerSeason } from "@/hooks/use-producer-season";
import { PRODUCTS } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/minha-producao")({
  head: () => ({
    meta: [
      { title: "Minha Produção — TerraIntelligence" },
      { name: "description", content: "Cadastre sua safra para calcular custos, margem e oportunidades financeiras." },
      { property: "og:title", content: "Minha Produção — TerraIntelligence" },
      { property: "og:description", content: "Transforme os dados da sua safra em decisões de margem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhaProducaoPage,
});

type FormState = {
  season_name: string;
  crop: string;
  area_hectares: string;
  expected_yield_bags_ha: string;
  seeds_fertilizers_cost_ha: string;
  operation_cost_ha: string;
  harvest_cost_ha: string;
  freight_storage_cost_ha: string;
  land_cost_ha: string;
  target_margin_pct: string;
};

const emptyForm: FormState = {
  season_name: "",
  crop: "",
  area_hectares: "",
  expected_yield_bags_ha: "",
  seeds_fertilizers_cost_ha: "",
  operation_cost_ha: "",
  harvest_cost_ha: "",
  freight_storage_cost_ha: "",
  land_cost_ha: "",
  target_margin_pct: "",
};

const inputClass = "w-full rounded-lg border border-soil-brown/15 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-harvest-green focus:ring-2 focus:ring-harvest-green/10";

function MinhaProducaoPage() {
  const { data: session } = useProfile();
  const season = useProducerSeason(session?.userId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!season.data) return;
    setForm({
      season_name: season.data.season_name ?? "",
      crop: season.data.crop ?? "",
      area_hectares: textNumber(season.data.area_hectares),
      expected_yield_bags_ha: textNumber(season.data.expected_yield_bags_ha),
      seeds_fertilizers_cost_ha: textNumber(season.data.seeds_fertilizers_cost_ha),
      operation_cost_ha: textNumber(season.data.operation_cost_ha),
      harvest_cost_ha: textNumber(season.data.harvest_cost_ha),
      freight_storage_cost_ha: textNumber(season.data.freight_storage_cost_ha),
      land_cost_ha: textNumber(season.data.land_cost_ha),
      target_margin_pct: textNumber(season.data.target_margin_pct),
    });
  }, [season.data]);

  const preview = {
    ...season.data,
    season_name: form.season_name || null,
    crop: form.crop || null,
    area_hectares: numberOrNull(form.area_hectares),
    expected_yield_bags_ha: numberOrNull(form.expected_yield_bags_ha),
    seeds_fertilizers_cost_ha: numberOrNull(form.seeds_fertilizers_cost_ha),
    operation_cost_ha: numberOrNull(form.operation_cost_ha),
    harvest_cost_ha: numberOrNull(form.harvest_cost_ha),
    freight_storage_cost_ha: numberOrNull(form.freight_storage_cost_ha),
    land_cost_ha: numberOrNull(form.land_cost_ha),
    target_margin_pct: numberOrNull(form.target_margin_pct),
  };
  const readiness = seasonCompleteness(preview as never);

  const save = useMutation({
    mutationFn: async () => {
      if (!session?.userId) throw new Error("Sua sessão não foi encontrada.");
      if (!form.season_name.trim() || !form.crop) throw new Error("Informe a safra e a cultura.");
      if (!(Number(form.area_hectares) > 0) || !(Number(form.expected_yield_bags_ha) > 0)) {
        throw new Error("Área e produtividade precisam ser maiores que zero.");
      }
      const margin = Number(form.target_margin_pct);
      if (!(margin >= 0 && margin < 100)) throw new Error("A margem desejada deve ficar entre 0% e 99%.");

      const { error } = await supabase.from("producer_seasons").upsert(
        {
          user_id: session.userId,
          season_name: form.season_name.trim().slice(0, 30),
          crop: form.crop,
          area_hectares: Number(form.area_hectares),
          expected_yield_bags_ha: Number(form.expected_yield_bags_ha),
          seeds_fertilizers_cost_ha: numberOrNull(form.seeds_fertilizers_cost_ha),
          operation_cost_ha: numberOrNull(form.operation_cost_ha),
          harvest_cost_ha: numberOrNull(form.harvest_cost_ha),
          freight_storage_cost_ha: numberOrNull(form.freight_storage_cost_ha),
          land_cost_ha: numberOrNull(form.land_cost_ha),
          target_margin_pct: margin,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Safra salva. Seu painel já pode usar este contexto.");
      void queryClient.invalidateQueries({ queryKey: seasonQueryKey(session?.userId) });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar a safra."),
  });

  return (
    <AppShell>
      <header className="flex flex-col gap-5 border-b border-soil-brown/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-clay">Minha Produção</p>
          <h1 className="mt-2 font-serif text-4xl text-harvest-green">Contexto da sua safra</h1>
          <p className="mt-2 max-w-2xl text-sm text-soil-brown/65">
            Estes dados permitem transformar o preço de mercado em custo por saca, ponto de equilíbrio e margem para a sua propriedade.
          </p>
        </div>
        <div className="min-w-52">
          <div className="flex justify-between text-xs font-semibold text-soil-brown/55">
            <span>Dados essenciais</span><span>{readiness.percentage}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soil-brown/10">
            <div className="h-full rounded-full bg-harvest-green transition-all" style={{ width: `${readiness.percentage}%` }} />
          </div>
        </div>
      </header>

      <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-5" data-tour="season-form">
          <div>
            <h2 className="font-serif text-2xl">1. Produção esperada</h2>
            <p className="text-sm text-soil-brown/55">Informe apenas o que você já sabe. Os valores podem ser atualizados depois.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Safra" hint="Ex.: 2026/27">
              <input required maxLength={30} value={form.season_name} onChange={(event) => setForm({ ...form, season_name: event.target.value })} className={inputClass} placeholder="2026/27" />
            </Field>
            <Field label="Cultura">
              <select required value={form.crop} onChange={(event) => setForm({ ...form, crop: event.target.value })} className={inputClass}>
                <option value="">Selecione</option>
                {PRODUCTS.map((product) => <option key={product} value={product}>{product}</option>)}
              </select>
            </Field>
            <NumberField label="Área plantada" suffix="ha" value={form.area_hectares} onChange={(value) => setForm({ ...form, area_hectares: value })} />
            <NumberField label="Produtividade esperada" suffix="sc/ha" value={form.expected_yield_bags_ha} onChange={(value) => setForm({ ...form, expected_yield_bags_ha: value })} />
            <NumberField label="Margem desejada" suffix="%" value={form.target_margin_pct} onChange={(value) => setForm({ ...form, target_margin_pct: value })} />
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="font-serif text-2xl">2. Custos por hectare</h2>
            <p className="text-sm text-soil-brown/55">Use seus próprios números. A plataforma não completa custos automaticamente.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Insumos" suffix="R$/ha" value={form.seeds_fertilizers_cost_ha} onChange={(value) => setForm({ ...form, seeds_fertilizers_cost_ha: value })} />
            <NumberField label="Operação" suffix="R$/ha" value={form.operation_cost_ha} onChange={(value) => setForm({ ...form, operation_cost_ha: value })} />
            <NumberField label="Colheita e secagem" suffix="R$/ha" value={form.harvest_cost_ha} onChange={(value) => setForm({ ...form, harvest_cost_ha: value })} />
            <NumberField label="Frete e armazenagem" suffix="R$/ha" value={form.freight_storage_cost_ha} onChange={(value) => setForm({ ...form, freight_storage_cost_ha: value })} />
            <NumberField label="Terra / arrendamento" suffix="R$/ha" value={form.land_cost_ha} onChange={(value) => setForm({ ...form, land_cost_ha: value })} />
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-soil-brown/10 pt-6 lg:col-span-2">
          <Button asChild variant="ghost"><Link to="/painel"><ArrowLeft aria-hidden /> Voltar ao painel</Link></Button>
          <div className="flex items-center gap-4">
            {readiness.complete && <span className="flex items-center gap-2 text-xs font-semibold text-gain"><CheckCircle2 className="size-4" aria-hidden /> Pronto para calcular</span>}
            <Button type="submit" size="lg" disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar minha safra"}</Button>
          </div>
        </footer>
      </form>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-wide text-soil-brown/50"><span>{label}</span>{hint && <span className="font-normal normal-case text-soil-brown/35">{hint}</span>}</span>{children}</label>;
}

function NumberField({ label, suffix, value, onChange }: { label: string; suffix: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><div className="relative"><input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} pr-16`} /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-soil-brown/40">{suffix}</span></div></Field>;
}

function numberOrNull(value: string) { return value.trim() === "" ? null : Number(value); }
function textNumber(value: number | null) { return value === null ? "" : String(value); }