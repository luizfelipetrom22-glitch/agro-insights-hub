import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/bem-vindo")({
  head: () => ({
    meta: [
      { title: "Escolha seu perfil — TerraIntelligence" },
      {
        name: "description",
        content: "Escolha usar a TerraIntelligence como produtor rural ou como comprador.",
      },
      { property: "og:title", content: "Escolha seu perfil — TerraIntelligence" },
      {
        property: "og:description",
        content: "Use a TerraIntelligence como produtor rural ou como comprador.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { data: session } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function choose(type: "produtor" | "comprador") {
    if (!session?.userId) return;
    setSaving(true);
    try {
      const { error: metaError } = await supabase.auth.updateUser({
        data: { user_type: type },
      });
      if (metaError) throw metaError;

      const { error } = await supabase
        .from("profiles")
        .update({ user_type: type })
        .eq("user_id", session.userId);
      if (error) throw error;

      if (type === "comprador") {
        await supabase.from("buyer_profiles").upsert(
          { user_id: session.userId, email: session.email, full_name: session.profile?.full_name ?? null },
          { onConflict: "user_id" },
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["session-profile"] });
      void navigate({ to: type === "comprador" ? "/comprador" : "/painel" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 font-sans text-soil-brown">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-serif text-4xl text-harvest-green">
          Como você deseja utilizar a plataforma?
        </h1>
        <p className="mt-2 text-sm text-soil-brown/60">
          Você pode mudar depois nas configurações do seu perfil.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            disabled={saving}
            onClick={() => choose("produtor")}
            className="rounded-2xl border border-soil-brown/15 bg-card p-8 text-left transition-colors hover:border-harvest-green disabled:opacity-50"
          >
            <span className="text-3xl">🌾</span>
            <h2 className="mt-3 font-serif text-2xl">Sou Produtor</h2>
            <p className="mt-1 text-sm text-soil-brown/60">
              Anuncie sua produção, acompanhe cotações e receba propostas de compradores.
            </p>
          </button>
          <button
            disabled={saving}
            onClick={() => choose("comprador")}
            className="rounded-2xl border border-soil-brown/15 bg-card p-8 text-left transition-colors hover:border-harvest-green disabled:opacity-50"
          >
            <span className="text-3xl">🛒</span>
            <h2 className="mt-3 font-serif text-2xl">Sou Comprador</h2>
            <p className="mt-1 text-sm text-soil-brown/60">
              Busque produtos, salve favoritos e publique pedidos de compra.
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}
