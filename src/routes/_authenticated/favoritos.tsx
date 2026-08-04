import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/agro/AppShell";
import { ListingCard, type Listing } from "@/components/agro/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — TerraIntelligence" },
      {
        name: "description",
        content: "Seus anúncios e produtores salvos no marketplace agrícola TerraIntelligence.",
      },
      { property: "og:title", content: "Favoritos — TerraIntelligence" },
      {
        property: "og:description",
        content: "Seus anúncios e produtores salvos no marketplace agrícola.",
      },
    ],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  const { data: session } = useProfile();
  const favorites = useFavorites(session?.userId);
  const toggleFavorite = useToggleFavorite(session?.userId);
  const [tab, setTab] = useState<"anuncios" | "produtores">("anuncios");

  const listingIds = (favorites.data ?? []).map((f) => f.listing_id).filter(Boolean) as string[];
  const producerIds = (favorites.data ?? []).map((f) => f.producer_id).filter(Boolean) as string[];

  const listings = useQuery({
    queryKey: ["favorite-listings", listingIds],
    enabled: listingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").in("id", listingIds);
      if (error) throw error;
      return data as Listing[];
    },
  });

  const producers = useQuery({
    queryKey: ["favorite-producers", producerIds],
    enabled: producerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", producerIds);
      if (error) throw error;
      return data as Tables<"profiles">[];
    },
  });

  const favoriteByListing = new Map(
    (favorites.data ?? []).filter((f) => f.listing_id).map((f) => [f.listing_id!, f.id]),
  );
  const favoriteByProducer = new Map(
    (favorites.data ?? []).filter((f) => f.producer_id).map((f) => [f.producer_id!, f.id]),
  );

  return (
    <AppShell>
      <header>
        <h2 className="font-serif text-4xl">Favoritos</h2>
        <p className="mt-1 text-sm text-soil-brown/60">
          Anúncios e produtores que você salvou para negociar depois.
        </p>
      </header>

      <div className="flex gap-2">
        {(["anuncios", "produtores"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-harvest-green text-harvest-green-foreground"
                : "border border-soil-brown/15 text-soil-brown/60 hover:bg-soil-brown/5"
            }`}
          >
            {t === "anuncios" ? "Anúncios" : "Produtores"}
          </button>
        ))}
      </div>

      {tab === "anuncios" && (
        <div className="grid gap-4 md:grid-cols-2">
          {listingIds.length === 0 && <Empty text="Você ainda não salvou nenhum anúncio." />}
          {listings.data?.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              favorited
              onToggleFavorite={() => {
                const existingId = favoriteByListing.get(l.id);
                if (existingId) toggleFavorite.mutate({ existingId });
              }}
            />
          ))}
        </div>
      )}

      {tab === "produtores" && (
        <div className="grid gap-4 md:grid-cols-2">
          {producerIds.length === 0 && <Empty text="Você ainda não salvou nenhum produtor." />}
          {producers.data?.map((p) => (
            <div
              key={p.user_id}
              className="flex items-center justify-between rounded-2xl border border-soil-brown/10 bg-card p-5"
            >
              <div>
                <h3 className="font-serif text-xl">{p.farm_name ?? p.full_name ?? "Produtor"}</h3>
                <p className="text-sm text-soil-brown/60">
                  {[p.city, p.state].filter(Boolean).join("/") || "Local não informado"}
                </p>
                <Link
                  to="/produtor/$id"
                  params={{ id: p.user_id }}
                  className="text-xs font-semibold text-harvest-green underline-offset-4 hover:underline"
                >
                  Ver perfil
                </Link>
              </div>
              <button
                onClick={() => {
                  const existingId = favoriteByProducer.get(p.user_id);
                  if (existingId) toggleFavorite.mutate({ existingId });
                }}
                className="rounded-lg border border-soil-brown/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-soil-brown/5"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-soil-brown/20 p-8 text-center text-sm text-soil-brown/50 md:col-span-2">
      {text}
    </p>
  );
}
