import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListingCard, type Listing } from "@/components/agro/marketplace/ListingCard";
import { Avatar } from "@/components/agro/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { getOrCreateConversation } from "@/lib/chat";
import { useSignedUrls } from "@/lib/storage";
import type { Tables } from "@/integrations/supabase/types";
import { TrustBadge, TrustDetails } from "@/components/agro/safety/TrustBadge";
import { ReportButton } from "@/components/agro/safety/ReportButton";
import { useBlocks, useToggleBlock, useTrust } from "@/hooks/use-safety";
import { SAFETY_TIPS } from "@/lib/safety";

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
  const navigate = useNavigate();

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
      if (session.userId === id) throw new Error("Esta é a sua própria página de produtor.");
      if (blocked) throw new Error("Você bloqueou este usuário. Desbloqueie na Central de Segurança.");
      await supabase
        .from("contact_events")
        .insert({ buyer_id: session.userId, producer_id: id });
      const conversation = await getOrCreateConversation({
        buyerId: session.userId,
        producerId: id,
      });
      return conversation.id;
    },
    onSuccess: (conversationId) => {
      void navigate({ to: "/mensagens", search: { conversa: conversationId } });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir a conversa."),
  });

  const p = producer.data;
  const trust = useTrust(id);
  const blocks = useBlocks(session?.userId);
  const block = blocks.data?.find((b) => b.blocked_id === id);
  const blocked = Boolean(block);
  const toggleBlock = useToggleBlock(session?.userId);
  const covers = useSignedUrls(
    "listing-photos",
    (listings.data ?? []).map((l) => l.photos?.[0]),
  );

  return (
    <main className="min-h-screen bg-background px-6 py-12 font-sans text-soil-brown">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <div className="flex items-center gap-4">
            <Avatar path={p?.avatar_url ?? null} name={p?.full_name ?? p?.farm_name} size={72} />
            <h1 className="font-serif text-4xl text-harvest-green">
              {p?.farm_name ?? p?.full_name ?? "Produtor"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-soil-brown/60">
            {[p?.city, p?.state].filter(Boolean).join("/") || "Local não informado"}
            {p?.crops?.length ? ` · ${p.crops.join(", ")}` : ""}
          </p>
          <div className="mt-3">
            <TrustBadge trust={trust.data} />
            <TrustDetails trust={trust.data} />
          </div>
          {p?.bio && <p className="mt-3 max-w-2xl text-sm text-soil-brown/70">{p.bio}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => contact.mutate()}
              disabled={contact.isPending || blocked}
              className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90 disabled:opacity-60"
            >
              {contact.isPending ? "Abrindo conversa…" : "Falar com o vendedor"}
            </button>
            {session && session.userId !== id && (
              <>
                <button
                  onClick={() =>
                    toggleBlock.mutate({ blockedId: id, ...(block ? { existingId: block.id } : {}) })
                  }
                  className="rounded-lg border border-soil-brown/15 px-4 py-3 text-xs font-semibold transition-colors hover:bg-soil-brown/5"
                >
                  {blocked ? "Desbloquear" : "Bloquear"}
                </button>
                <ReportButton
                  target={{ targetType: "usuario", targetId: id, reportedUserId: id }}
                  label="Denunciar produtor"
                />
              </>
            )}
          </div>
          <div className="mt-5 rounded-xl border border-clay/30 bg-clay/5 px-4 py-3 text-xs text-soil-brown/70">
            <p className="font-semibold text-clay">Negocie com segurança</p>
            <p className="mt-1">{SAFETY_TIPS[0]} {SAFETY_TIPS[2]}</p>
          </div>
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
              <ListingCard
                key={l.id}
                listing={l}
                photoUrl={l.photos?.[0] ? covers.data?.[l.photos[0]] : undefined}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
