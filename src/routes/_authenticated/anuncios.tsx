import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  CERTIFICATIONS,
  PRODUCTS,
  STATES,
  UNITS,
  formatBRL,
  formatQuantity,
} from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/anuncios")({
  head: () => ({
    meta: [
      { title: "Meus Anúncios — TerraIntelligence" },
      {
        name: "description",
        content:
          "Publique e gerencie os anúncios da sua produção agrícola no marketplace TerraIntelligence.",
      },
      { property: "og:title", content: "Meus Anúncios — TerraIntelligence" },
      {
        property: "og:description",
        content: "Publique e gerencie os anúncios da sua produção agrícola.",
      },
    ],
  }),
  component: AnunciosPage,
});

type Listing = Tables<"listings">;

const emptyForm = {
  product: "Soja",
  description: "",
  quantity: "0",
  unit: "saco" as string,
  price: "",
  state: "MT" as string,
  city: "",
  harvest: "",
  certifications: [] as string[],
  organic: false,
  family_farming: false,
};

function AnunciosPage() {
  const { data: session } = useProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const listings = useQuery({
    queryKey: ["my-listings", session?.userId],
    enabled: Boolean(session?.userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", session!.userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<"listings"> = {
        user_id: session!.userId,
        product: form.product.trim(),
        description: form.description.trim() || null,
        quantity: Number(form.quantity) || 0,
        unit: form.unit,
        price: form.price ? Number(form.price) : null,
        state: form.state,
        city: form.city.trim() || null,
        harvest: form.harvest.trim() || null,
        certifications: form.certifications,
        organic: form.organic,
        family_farming: form.family_farming,
      };
      if (editingId) {
        const { error } = await supabase.from("listings").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Anúncio atualizado." : "Anúncio publicado.");
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
  });

  const toggleStatus = useMutation({
    mutationFn: async (listing: Listing) => {
      const { error } = await supabase
        .from("listings")
        .update({ status: listing.status === "ativo" ? "pausado" : "ativo" })
        .eq("id", listing.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio excluído.");
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });

  function startEdit(l: Listing) {
    setEditingId(l.id);
    setOpen(true);
    setForm({
      product: l.product,
      description: l.description ?? "",
      quantity: String(l.quantity),
      unit: l.unit,
      price: l.price === null ? "" : String(l.price),
      state: l.state ?? "MT",
      city: l.city ?? "",
      harvest: l.harvest ?? "",
      certifications: l.certifications,
      organic: l.organic,
      family_farming: l.family_farming,
    });
  }

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl">Meus anúncios</h2>
          <p className="mt-1 text-sm text-soil-brown/60">
            Publique sua produção e receba propostas de compradores de todo o Brasil.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setOpen((v) => !v);
          }}
          className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90"
        >
          {open ? "Fechar formulário" : "Novo anúncio"}
        </button>
      </header>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-soil-brown/10 bg-card p-6 sm:grid-cols-2"
        >
          <Field label="Produto">
            <input
              list="produtos"
              required
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              className={inputClass}
            />
            <datalist id="produtos">
              {PRODUCTS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Safra">
            <input
              value={form.harvest}
              onChange={(e) => setForm({ ...form, harvest: e.target.value })}
              placeholder="2025/26"
              className={inputClass}
            />
          </Field>
          <Field label="Quantidade">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Unidade">
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className={inputClass}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preço por unidade (R$)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Opcional"
              className={inputClass}
            />
          </Field>
          <Field label="Estado">
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={inputClass}
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cidade">
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Certificações">
            <select
              multiple
              value={form.certifications}
              onChange={(e) =>
                setForm({
                  ...form,
                  certifications: Array.from(e.target.selectedOptions).map((o) => o.value),
                })
              }
              className={`${inputClass} h-24`}
            >
              {CERTIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descrição">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.organic}
              onChange={(e) => setForm({ ...form, organic: e.target.checked })}
            />
            Produção orgânica
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.family_farming}
              onChange={(e) => setForm({ ...form, family_farming: e.target.checked })}
            />
            Agricultura familiar
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground disabled:opacity-50"
            >
              {save.isPending ? "Salvando..." : editingId ? "Salvar alterações" : "Publicar anúncio"}
            </button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        {listings.isLoading && <p className="text-sm text-soil-brown/50">Carregando anúncios...</p>}
        {listings.data?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-soil-brown/20 p-8 text-center text-sm text-soil-brown/50">
            Você ainda não publicou nenhum anúncio.
          </p>
        )}
        {listings.data?.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-soil-brown/10 bg-card p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl">{l.product}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide ${
                    l.status === "ativo"
                      ? "bg-gain/15 text-gain"
                      : "bg-soil-brown/10 text-soil-brown/60"
                  }`}
                >
                  {l.status}
                </span>
              </div>
              <p className="text-sm text-soil-brown/60">
                {formatQuantity(l.quantity, l.unit)} · {formatBRL(l.price)} ·{" "}
                {[l.city, l.state].filter(Boolean).join("/") || "Local não informado"}
              </p>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <button onClick={() => startEdit(l)} className={secondaryBtn}>
                Editar
              </button>
              <button onClick={() => toggleStatus.mutate(l)} className={secondaryBtn}>
                {l.status === "ativo" ? "Pausar" : "Reativar"}
              </button>
              <button
                onClick={() => remove.mutate(l.id)}
                className="rounded-lg border border-loss/30 px-3 py-2 text-loss transition-colors hover:bg-loss/10"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-lg border border-soil-brown/15 bg-background px-3 py-2 text-sm outline-none focus:border-harvest-green";
const secondaryBtn =
  "rounded-lg border border-soil-brown/15 px-3 py-2 transition-colors hover:bg-soil-brown/5";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
        {label}
      </span>
      {children}
    </label>
  );
}
