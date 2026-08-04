import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { PRODUCTS, STATES, UNITS, formatBRL, formatDate, formatQuantity } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos de Compra — TerraIntelligence" },
      {
        name: "description",
        content:
          "Publique demandas de compra de produtos agrícolas e encontre produtores compatíveis.",
      },
      { property: "og:title", content: "Pedidos de Compra — TerraIntelligence" },
      {
        property: "og:description",
        content: "Publique demandas de compra e encontre produtores compatíveis.",
      },
    ],
  }),
  component: PedidosPage,
});

type PurchaseRequest = Tables<"purchase_requests">;

const emptyForm = {
  product: "Soja",
  quantity: "0",
  unit: "saco" as string,
  state: "MT" as string,
  city: "",
  target_price: "",
  deadline: "",
  notes: "",
};

function PedidosPage() {
  const { data: session } = useProfile();
  const isBuyer = session?.userType === "comprador";
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);

  const mine = useQuery({
    queryKey: ["my-requests", session?.userId],
    enabled: Boolean(session?.userId) && isBuyer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("user_id", session!.userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseRequest[];
    },
  });

  const openRequests = useQuery({
    queryKey: ["open-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("status", "aberto")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as PurchaseRequest[];
    },
  });

  const myProducts = useQuery({
    queryKey: ["my-listing-products", session?.userId],
    enabled: Boolean(session?.userId) && !isBuyer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("product, state")
        .eq("user_id", session!.userId);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<"purchase_requests"> = {
        user_id: session!.userId,
        product: form.product.trim(),
        quantity: Number(form.quantity) || 0,
        unit: form.unit,
        state: form.state,
        city: form.city.trim() || null,
        target_price: form.target_price ? Number(form.target_price) : null,
        deadline: form.deadline || null,
        notes: form.notes.trim() || null,
      };
      const { error } = await supabase.from("purchase_requests").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido de compra publicado.");
      setForm(emptyForm);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["open-requests"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível publicar."),
  });

  const closeRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_requests")
        .update({ status: "encerrado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido encerrado.");
      void queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["open-requests"] });
    },
  });

  const productSet = new Set(
    (myProducts.data ?? []).map((l) => l.product.toLowerCase()),
  );
  const stateSet = new Set((myProducts.data ?? []).map((l) => l.state));
  const compatible = (openRequests.data ?? []).filter(
    (r) => productSet.has(r.product.toLowerCase()) || stateSet.has(r.state),
  );

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl">
            {isBuyer ? "Meus pedidos de compra" : "Pedidos de compra"}
          </h2>
          <p className="mt-1 text-sm text-soil-brown/60">
            {isBuyer
              ? "Publique sua demanda e deixe que os produtores encontrem você."
              : "Demandas publicadas por compradores em todo o Brasil."}
          </p>
        </div>
        {isBuyer && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90"
          >
            {open ? "Fechar formulário" : "Novo pedido"}
          </button>
        )}
      </header>

      {isBuyer && open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-soil-brown/10 bg-card p-6 sm:grid-cols-2"
        >
          <Field label="Produto">
            <input
              list="produtos-pedido"
              required
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              className={inputClass}
            />
            <datalist id="produtos-pedido">
              {PRODUCTS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
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
          <Field label="Preço desejado (R$, opcional)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.target_price}
              onChange={(e) => setForm({ ...form, target_price: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Prazo">
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Observações">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground disabled:opacity-50"
            >
              {create.isPending ? "Publicando..." : "Publicar pedido"}
            </button>
          </div>
        </form>
      )}

      {isBuyer ? (
        <section className="space-y-3">
          {mine.data?.length === 0 && (
            <Empty text="Você ainda não publicou nenhum pedido de compra." />
          )}
          {mine.data?.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              action={
                r.status === "aberto" ? (
                  <button
                    onClick={() => closeRequest.mutate(r.id)}
                    className="rounded-lg border border-soil-brown/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-soil-brown/5"
                  >
                    Encerrar
                  </button>
                ) : null
              }
            />
          ))}
        </section>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">
              Compatíveis com sua produção
            </h3>
            {compatible.length === 0 && (
              <Empty text="Nenhum pedido compatível no momento. Publique anúncios para melhorar as recomendações." />
            )}
            {compatible.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">
              Todos os pedidos abertos
            </h3>
            {openRequests.data?.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function RequestRow({
  request,
  action,
}: {
  request: PurchaseRequest;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-soil-brown/10 bg-card p-5">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-xl">{request.product}</h3>
          <span className="rounded-full bg-soil-brown/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-soil-brown/60">
            {request.status}
          </span>
        </div>
        <p className="text-sm text-soil-brown/60">
          {formatQuantity(request.quantity, request.unit)} ·{" "}
          {request.target_price ? formatBRL(request.target_price) : "Preço a combinar"} ·{" "}
          {[request.city, request.state].filter(Boolean).join("/") || "Local não informado"} · prazo{" "}
          {formatDate(request.deadline)}
        </p>
        {request.notes && <p className="mt-2 text-sm text-soil-brown/70">{request.notes}</p>}
      </div>
      {action}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-soil-brown/20 p-8 text-center text-sm text-soil-brown/50">
      {text}
    </p>
  );
}

const inputClass =
  "w-full rounded-lg border border-soil-brown/15 bg-background px-3 py-2 text-sm outline-none focus:border-harvest-green";

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
