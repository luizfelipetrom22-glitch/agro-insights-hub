import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/agro/AppShell";
import { ListingCard, type Listing } from "@/components/agro/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import { formatDate, formatQuantity } from "@/lib/marketplace";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/comprador")({
  head: () => ({
    meta: [
      { title: "Painel do Comprador — TerraIntelligence" },
      {
        name: "description",
        content:
          "Produtos recomendados, últimos anúncios, favoritos e histórico de negociações para compradores do agro.",
      },
      { property: "og:title", content: "Painel do Comprador — TerraIntelligence" },
      {
        property: "og:description",
        content: "Produtos recomendados, favoritos e negociações do comprador agrícola.",
      },
    ],
  }),
  component: CompradorPage,
});

function CompradorPage() {
  const { data: session, isLoading } = useProfile();
  const navigate = useNavigate();
  const favorites = useFavorites(session?.userId);
  const toggleFavorite = useToggleFavorite(session?.userId);

  useEffect(() => {
    if (!isLoading && session && session.userType !== "comprador") {
      void navigate({ to: "/painel" });
    }
  }, [isLoading, session, navigate]);

  const interests = session?.buyerProfile?.interests ?? [];

  const latest = useQuery({
    queryKey: ["latest-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Listing[];
    },
  });

  const myRequests = useQuery({
    queryKey: ["my-requests", session?.userId],
    enabled: Boolean(session?.userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("user_id", session!.userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Tables<"purchase_requests">[];
    },
  });

  const contacts = useQuery({
    queryKey: ["my-contacts", session?.userId],
    enabled: Boolean(session?.userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_events")
        .select("*")
        .eq("buyer_id", session!.userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Tables<"contact_events">[];
    },
  });

  const all = latest.data ?? [];
  const recommended = interests.length
    ? all.filter((l) =>
        interests.some((i) => l.product.toLowerCase().includes(i.toLowerCase())),
      )
    : [];
  const favoriteByListing = new Map(
    (favorites.data ?? []).filter((f) => f.listing_id).map((f) => [f.listing_id!, f.id]),
  );

  function favoriteHandler(l: Listing) {
    const existingId = favoriteByListing.get(l.id);
    toggleFavorite.mutate(existingId ? { existingId } : { listingId: l.id });
  }

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl">
            Olá, {session?.buyerProfile?.full_name ?? "comprador"}
          </h2>
          <p className="mt-1 text-sm text-soil-brown/60">
            Encontre produtores, salve favoritos e publique suas demandas de compra.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/buscar"
            className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90"
          >
            Buscar produtos
          </Link>
          <Link
            to="/pedidos"
            className="rounded-lg border border-soil-brown/15 px-5 py-3 text-sm font-semibold transition-colors hover:bg-soil-brown/5"
          >
            Publicar pedido
          </Link>
        </div>
      </header>

      {recommended.length > 0 && (
        <Section title="Recomendados para você">
          <div className="grid gap-4 md:grid-cols-2">
            {recommended.slice(0, 4).map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                favorited={favoriteByListing.has(l.id)}
                onToggleFavorite={favoriteHandler}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Últimos anúncios">
        {latest.isLoading && <p className="text-sm text-soil-brown/50">Carregando...</p>}
        {!latest.isLoading && all.length === 0 && (
          <Empty text="Ainda não há anúncios publicados. Publique um pedido de compra para atrair produtores." />
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {all.slice(0, 6).map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              favorited={favoriteByListing.has(l.id)}
              onToggleFavorite={favoriteHandler}
            />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Favoritos">
          <p className="font-serif text-4xl text-harvest-green">
            {favorites.data?.length ?? 0}
          </p>
          <Link to="/favoritos" className="text-xs font-semibold text-harvest-green hover:underline">
            Ver favoritos
          </Link>
        </Card>

        <Card title="Pedidos publicados">
          {myRequests.data?.length ? (
            <ul className="space-y-2 text-sm">
              {myRequests.data.map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span>{r.product}</span>
                  <span className="text-soil-brown/50">
                    {formatQuantity(r.quantity, r.unit)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-soil-brown/50">Nenhum pedido publicado ainda.</p>
          )}
          <Link to="/pedidos" className="text-xs font-semibold text-harvest-green hover:underline">
            Gerenciar pedidos
          </Link>
        </Card>

        <Card title="Histórico de negociações">
          {contacts.data?.length ? (
            <ul className="space-y-2 text-sm">
              {contacts.data.map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <Link
                    to="/produtor/$id"
                    params={{ id: c.producer_id }}
                    className="text-harvest-green hover:underline"
                  >
                    Produtor contatado
                  </Link>
                  <span className="text-soil-brown/50">{formatDate(c.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-soil-brown/50">
              Nenhum contato ainda. O chat completo chega na próxima fase.
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">{title}</h3>
      {children}
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-soil-brown/10 bg-card p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">{title}</h3>
      {children}
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
