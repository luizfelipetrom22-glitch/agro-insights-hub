import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ListingCard, type Listing } from "@/components/agro/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/produtor/$id")({
  head: () => ({
    meta: [
      { title: "Perfil do Produtor — TerraIntelligence" },
      {
        name: "description",
        content:
          "Conheça o produtor, sua fazenda e todos os anúncios ativos no marketplace agrícola TerraIntelligence.",
      },
      { property: "og:title", content: "Perfil do Produtor — TerraIntelligence" },
      {
        property: "og:description",
        content: "Conheça o produtor, sua fazenda e seus anúncios ativos.",
      },
    ],
  }),
  component: ProducerPage,
});

function ProducerPage() {
  const { id } = useParams({ from: "/produtor/$id" });
  const { data: session } = useProfile();
  const [revealed, setRevealed] = useState(false);

  const producer = useQuery({
    queryKey: ["producer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Tables<"profiles"> | null;
    },
  });

  const listings = useQuery({
    queryKey: ["producer-listings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", id)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  const contact = useMutation({
    mutationFn: async () => {
      if (!session?.userId) throw new Error("Entre na sua conta para ver o contato.");
      const { error } = await supabase
        .from("contact_events")
        .insert({ buyer_id: session.userId, producer_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      setRevealed(true);
      toast.success("Contato liberado e registrado no seu histórico.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível liberar o contato."),
  });

  const p = producer.data;

  return (
    <main className="min-h-screen bg-background px-6 py-12 font-sans text-soil-brown">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <h1 className="font-serif text-4xl text-harvest-green">
            {p?.farm_name ?? p?.full_name ?? "Produtor"}
          </h1>
          <p className="mt-1 text-sm text-soil-brown/60">
            {[p?.city, p?.state].filter(Boolean).join("/") || "Local não informado"}
            {p?.crops?.length ? ` · ${p.crops.join(", ")}` : ""}
          </p>
          <button
            onClick={() => contact.mutate()}
            disabled={contact.isPending || revealed}
            className="mt-4 rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90 disabled:opacity-60"
          >
            {revealed ? "Contato liberado" : "Falar com o vendedor"}
          </button>
          {revealed && (
            <p className="mt-2 text-sm text-soil-brown/70">
              O produtor foi notificado do seu interesse. O chat com envio de imagens e documentos
              chega na próxima fase.
            </p>
          )}
        </header>

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">
            Anúncios ativos
          </h2>
          {listings.data?.length === 0 && (
            <p className="rounded-2xl border border-dashed border-soil-brown/20 p-8 text-center text-sm text-soil-brown/50">
              Este produtor ainda não tem anúncios ativos.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {listings.data?.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
