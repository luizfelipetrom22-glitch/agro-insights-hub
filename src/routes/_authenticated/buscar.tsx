import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { ListingCard, type Listing } from "@/components/agro/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import { CERTIFICATIONS, STATES, proximityLabel, proximityScore } from "@/lib/marketplace";
import { useSignedUrls } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar Produtos — TerraIntelligence" },
      {
        name: "description",
        content:
          "Encontre soja, milho, café e outros produtos agrícolas por estado, cidade, preço e certificações.",
      },
      { property: "og:title", content: "Buscar Produtos — TerraIntelligence" },
      {
        property: "og:description",
        content: "Encontre produtos agrícolas por estado, cidade, preço e certificações.",
      },
    ],
  }),
  component: BuscarPage,
});

function BuscarPage() {
  const { data: session } = useProfile();
  const favorites = useFavorites(session?.userId);
  const toggleFavorite = useToggleFavorite(session?.userId);

  const [product, setProduct] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [certification, setCertification] = useState("");
  const [organic, setOrganic] = useState(false);
  const [familyFarming, setFamilyFarming] = useState(false);
  const [sort, setSort] = useState<"recentes" | "menor" | "maior" | "proximos">("recentes");

  const listings = useQuery({
    queryKey: ["listings-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Listing[];
    },
  });

  const base = {
    state: session?.buyerProfile?.state ?? null,
    city: session?.buyerProfile?.city ?? null,
  };

  const results = useMemo(() => {
    const all = listings.data ?? [];
    const filtered = all.filter((l) => {
      if (product && !l.product.toLowerCase().includes(product.toLowerCase())) return false;
      if (state && l.state !== state) return false;
      if (city && !(l.city ?? "").toLowerCase().includes(city.toLowerCase())) return false;
      if (minQuantity && l.quantity < Number(minQuantity)) return false;
      if (minPrice && (l.price ?? 0) < Number(minPrice)) return false;
      if (maxPrice && (l.price ?? Number.MAX_SAFE_INTEGER) > Number(maxPrice)) return false;
      if (certification && !l.certifications.includes(certification)) return false;
      if (organic && !l.organic) return false;
      if (familyFarming && !l.family_farming) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "menor") sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "maior") sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    if (sort === "proximos")
      sorted.sort((a, b) => proximityScore(base, a) - proximityScore(base, b));
    return sorted;
  }, [
    listings.data, product, state, city, minQuantity, minPrice, maxPrice,
    certification, organic, familyFarming, sort, base.state, base.city,
  ]);

  const favoriteByListing = new Map(
    (favorites.data ?? []).filter((f) => f.listing_id).map((f) => [f.listing_id!, f.id]),
  );

  const covers = useSignedUrls(
    "listing-photos",
    results.map((l) => l.photos?.[0]),
  );

  return (
    <AppShell>
      <header>
        <h2 className="font-serif text-4xl">Buscar produtos</h2>
        <p className="mt-1 text-sm text-soil-brown/60">
          {results.length} anúncio{results.length === 1 ? "" : "s"} disponível
          {results.length === 1 ? "" : "eis"} no marketplace.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-soil-brown/10 bg-card p-5 md:grid-cols-4">
        <Input label="Produto" value={product} onChange={setProduct} placeholder="Soja, milho..." />
        <Select label="Estado" value={state} onChange={setState} options={["", ...STATES]} />
        <Input label="Cidade" value={city} onChange={setCity} />
        <Input label="Qtd. mínima" value={minQuantity} onChange={setMinQuantity} type="number" />
        <Input label="Preço mín. (R$)" value={minPrice} onChange={setMinPrice} type="number" />
        <Input label="Preço máx. (R$)" value={maxPrice} onChange={setMaxPrice} type="number" />
        <Select
          label="Certificação"
          value={certification}
          onChange={setCertification}
          options={["", ...CERTIFICATIONS]}
        />
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-soil-brown/50">
            Ordenar por
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className={inputClass}
          >
            <option value="recentes">Mais recentes</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
            <option value="proximos">Mais próximos</option>
          </select>
        </label>
        <label className="col-span-2 flex items-center gap-2 text-sm md:col-span-1">
          <input type="checkbox" checked={organic} onChange={(e) => setOrganic(e.target.checked)} />
          Somente orgânicos
        </label>
        <label className="col-span-2 flex items-center gap-2 text-sm md:col-span-1">
          <input
            type="checkbox"
            checked={familyFarming}
            onChange={(e) => setFamilyFarming(e.target.checked)}
          />
          Agricultura familiar
        </label>
      </div>

      {listings.isLoading && <p className="text-sm text-soil-brown/50">Carregando anúncios...</p>}
      {!listings.isLoading && results.length === 0 && (
        <p className="rounded-2xl border border-dashed border-soil-brown/20 p-8 text-center text-sm text-soil-brown/50">
          Nenhum anúncio encontrado com esses filtros. Publique um pedido de compra para que os
          produtores encontrem você.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((l) => (
          <ListingCard
            key={l.id}
            listing={l}
            photoUrl={l.photos?.[0] ? covers.data?.[l.photos[0]] : undefined}
            favorited={favoriteByListing.has(l.id)}
            onToggleFavorite={() => {
              const existingId = favoriteByListing.get(l.id);
              toggleFavorite.mutate(
                existingId ? { existingId } : { listingId: l.id },
                {
                  onSuccess: () =>
                    toast.success(existingId ? "Removido dos favoritos." : "Salvo nos favoritos."),
                  onError: (e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Erro ao favoritar."),
                },
              );
            }}
            footer={
              <span className="text-[11px] uppercase tracking-wide text-soil-brown/40">
                {proximityLabel(proximityScore(base, l))}
              </span>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-lg border border-soil-brown/15 bg-background px-3 py-2 text-sm outline-none focus:border-harvest-green";

function Input({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-soil-brown/50">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-soil-brown/50">
        {label}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "" ? "Todos" : o}
          </option>
        ))}
      </select>
    </label>
  );
}
