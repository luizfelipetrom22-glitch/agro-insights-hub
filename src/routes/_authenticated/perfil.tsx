import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { Avatar } from "@/components/agro/Avatar";
import { PhotoUploader } from "@/components/agro/PhotoUploader";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { PRODUCTS, STATES } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — TerraIntelligence" },
      {
        name: "description",
        content:
          "Atualize seus dados de produtor ou comprador: foto, contato, localização e produtos de interesse.",
      },
      { property: "og:title", content: "Meu Perfil — TerraIntelligence" },
      {
        property: "og:description",
        content: "Atualize foto, contato, localização e produtos no seu perfil.",
      },
    ],
  }),
  component: PerfilPage,
});

const inputClass =
  "w-full rounded-lg border border-soil-brown/15 bg-background px-3 py-2 text-sm outline-none focus:border-harvest-green";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function PerfilPage() {
  const { data: session } = useProfile();
  const isBuyer = session?.userType === "comprador";

  return (
    <AppShell>
      <header>
        <h2 className="font-serif text-4xl text-harvest-green">Meu perfil</h2>
        <p className="mt-1 text-sm text-soil-brown/60">
          {isBuyer
            ? "Complete seus dados para que produtores conheçam sua empresa."
            : "Mantenha seus dados de contato e apresentação. Os números da safra ficam em Minha Produção."}
        </p>
      </header>
      {session ? (
        isBuyer ? (
          <BuyerForm userId={session.userId} email={session.email} />
        ) : (
          <ProducerForm userId={session.userId} />
        )
      ) : (
        <p className="text-sm text-soil-brown/50">Carregando…</p>
      )}
    </AppShell>
  );
}

function ProducerForm({ userId }: { userId: string }) {
  const { data: session } = useProfile();
  const queryClient = useQueryClient();
  const profile = session?.profile ?? null;

  const [form, setForm] = useState({
    full_name: "",
    farm_name: "",
    city: "",
    state: "MT",
    crops: [] as string[],
    phone: "",
    bio: "",
    avatar_url: [] as string[],
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      farm_name: profile.farm_name ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "MT",
      crops: profile.crops ?? [],
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      avatar_url: profile.avatar_url ? [profile.avatar_url] : [],
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Informe seu nome.");
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          full_name: form.full_name.trim().slice(0, 120),
          farm_name: form.farm_name.trim().slice(0, 120) || null,
          city: form.city.trim().slice(0, 80) || null,
          state: form.state,
          crops: form.crops,
          phone: form.phone.trim().slice(0, 30) || null,
          bio: form.bio.trim().slice(0, 600) || null,
          avatar_url: form.avatar_url[0] ?? null,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["session-profile"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-soil-brown/10 bg-card p-6 sm:grid-cols-2"
    >
      <div className="sm:col-span-2 flex items-center gap-4">
        <Avatar path={form.avatar_url[0] ?? null} name={form.full_name} size={64} />
        <div className="flex-1">
          <Field label="Foto de perfil">
            <PhotoUploader
              bucket="avatars"
              userId={userId}
              value={form.avatar_url}
              onChange={(paths) => setForm({ ...form, avatar_url: paths.slice(-1) })}
              max={1}
            />
          </Field>
        </div>
      </div>

      <Field label="Nome completo">
        <input
          required
          maxLength={120}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Nome da fazenda">
        <input
          maxLength={120}
          value={form.farm_name}
          onChange={(e) => setForm({ ...form, farm_name: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Cidade">
        <input
          maxLength={80}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
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
      <Field label="Telefone / WhatsApp">
        <input
          maxLength={30}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(65) 90000-0000"
          className={inputClass}
        />
      </Field>
      <Field label="Culturas">
        <select
          multiple
          value={form.crops}
          onChange={(e) =>
            setForm({ ...form, crops: Array.from(e.target.selectedOptions).map((o) => o.value) })
          }
          className={`${inputClass} h-24`}
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Sobre a fazenda">
          <textarea
            rows={4}
            maxLength={600}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground disabled:opacity-50"
        >
          {save.isPending ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>
    </form>
  );
}

function BuyerForm({ userId, email }: { userId: string; email: string | null }) {
  const { data: session } = useProfile();
  const queryClient = useQueryClient();
  const buyer = session?.buyerProfile ?? null;

  const [form, setForm] = useState({
    full_name: "",
    company: "",
    tax_id: "",
    city: "",
    state: "MT",
    interests: [] as string[],
    avg_quantity: "",
    phone: "",
    avatar_url: [] as string[],
  });

  useEffect(() => {
    if (!buyer) return;
    setForm({
      full_name: buyer.full_name ?? "",
      company: buyer.company ?? "",
      tax_id: buyer.tax_id ?? "",
      city: buyer.city ?? "",
      state: buyer.state ?? "MT",
      interests: buyer.interests ?? [],
      avg_quantity: buyer.avg_quantity === null ? "" : String(buyer.avg_quantity),
      phone: buyer.phone ?? "",
      avatar_url: buyer.avatar_url ? [buyer.avatar_url] : [],
    });
  }, [buyer]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Informe seu nome.");
      const { error } = await supabase.from("buyer_profiles").upsert(
        {
          user_id: userId,
          full_name: form.full_name.trim().slice(0, 120),
          company: form.company.trim().slice(0, 120) || null,
          tax_id: form.tax_id.trim().slice(0, 20) || null,
          city: form.city.trim().slice(0, 80) || null,
          state: form.state,
          interests: form.interests,
          avg_quantity: form.avg_quantity ? Number(form.avg_quantity) : null,
          phone: form.phone.trim().slice(0, 30) || null,
          email,
          avatar_url: form.avatar_url[0] ?? null,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["session-profile"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-soil-brown/10 bg-card p-6 sm:grid-cols-2"
    >
      <div className="sm:col-span-2 flex items-center gap-4">
        <Avatar path={form.avatar_url[0] ?? null} name={form.full_name} size={64} />
        <div className="flex-1">
          <Field label="Foto de perfil">
            <PhotoUploader
              bucket="avatars"
              userId={userId}
              value={form.avatar_url}
              onChange={(paths) => setForm({ ...form, avatar_url: paths.slice(-1) })}
              max={1}
            />
          </Field>
        </div>
      </div>

      <Field label="Nome completo">
        <input
          required
          maxLength={120}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Empresa">
        <input
          maxLength={120}
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="CPF / CNPJ">
        <input
          maxLength={20}
          value={form.tax_id}
          onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Telefone / WhatsApp">
        <input
          maxLength={30}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(11) 90000-0000"
          className={inputClass}
        />
      </Field>
      <Field label="Cidade">
        <input
          maxLength={80}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
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
      <Field label="Produtos de interesse">
        <select
          multiple
          value={form.interests}
          onChange={(e) =>
            setForm({
              ...form,
              interests: Array.from(e.target.selectedOptions).map((o) => o.value),
            })
          }
          className={`${inputClass} h-24`}
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Quantidade média comprada">
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.avg_quantity}
          onChange={(e) => setForm({ ...form, avg_quantity: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground disabled:opacity-50"
        >
          {save.isPending ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>
    </form>
  );
}