import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/agro/AppShell";
import { Avatar } from "@/components/agro/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useBlocks, useMyReports, useToggleBlock } from "@/hooks/use-safety";
import { SAFETY_TIPS } from "@/lib/safety";
import { formatDate } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/seguranca")({
  head: () => ({
    meta: [
      { title: "Central de Segurança — TerraIntelligence" },
      {
        name: "description",
        content:
          "Proteja-se de golpes no marketplace agrícola: denuncie perfis suspeitos, bloqueie usuários e siga as regras de negociação segura.",
      },
      { property: "og:title", content: "Central de Segurança — TerraIntelligence" },
      {
        property: "og:description",
        content: "Denuncie golpes, bloqueie usuários e negocie com segurança.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  const { data: session } = useProfile();
  const userId = session?.userId;
  const reports = useMyReports(userId);
  const blocks = useBlocks(userId);
  const toggleBlock = useToggleBlock(userId);

  const blockedIds = (blocks.data ?? []).map((b) => b.blocked_id);
  const blockedNames = useQuery({
    queryKey: ["blocked-names", blockedIds.slice().sort().join("|")],
    enabled: blockedIds.length > 0,
    queryFn: async () => {
      const [{ data: profiles }, { data: buyers }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, farm_name, avatar_url").in("user_id", blockedIds),
        supabase.from("buyer_profiles").select("user_id, full_name, company, avatar_url").in("user_id", blockedIds),
      ]);
      const map: Record<string, { name: string; avatar: string | null }> = {};
      for (const p of profiles ?? []) {
        map[p.user_id] = { name: p.farm_name || p.full_name || "Usuário", avatar: p.avatar_url };
      }
      for (const b of buyers ?? []) {
        map[b.user_id] = {
          name: b.company || b.full_name || map[b.user_id]?.name || "Usuário",
          avatar: b.avatar_url ?? map[b.user_id]?.avatar ?? null,
        };
      }
      return map;
    },
  });

  return (
    <AppShell>
      <header>
        <h1 className="font-serif text-4xl text-harvest-green">Central de Segurança</h1>
        <p className="mt-1 max-w-2xl text-sm text-soil-brown/60">
          O marketplace monitora preços fora da curva, mensagens com pedido de pagamento antecipado e
          perfis denunciados. Aqui você acompanha suas denúncias e seus bloqueios.
        </p>
      </header>

      <section className="rounded-2xl border border-soil-brown/10 bg-card p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">
          Regras de ouro contra golpes
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SAFETY_TIPS.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm text-soil-brown/75">
              <span className="text-harvest-green" aria-hidden>
                ✓
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">
          Minhas denúncias
        </h2>
        {reports.data?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-soil-brown/20 p-8 text-center text-sm text-soil-brown/50">
            Você ainda não fez nenhuma denúncia. Use o botão “Denunciar” nos anúncios, no perfil do
            produtor ou dentro da conversa.
          </p>
        )}
        {reports.data?.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-soil-brown/10 bg-card p-5"
          >
            <div>
              <p className="font-semibold">{r.reason}</p>
              <p className="text-xs text-soil-brown/55">
                {r.target_type} · enviada em {formatDate(r.created_at)}
              </p>
              {r.details && <p className="mt-2 text-sm text-soil-brown/70">{r.details}</p>}
            </div>
            <span className="rounded-full bg-soil-brown/10 px-3 py-1 text-[11px] uppercase tracking-wide text-soil-brown/60">
              {r.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">
          Usuários bloqueados
        </h2>
        {blocks.data?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-soil-brown/20 p-8 text-center text-sm text-soil-brown/50">
            Ninguém bloqueado. Quem você bloquear não consegue mais enviar mensagens para você.
          </p>
        )}
        {blocks.data?.map((b) => {
          const info = blockedNames.data?.[b.blocked_id];
          return (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-soil-brown/10 bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar path={info?.avatar ?? null} name={info?.name} size={36} />
                <div>
                  <p className="text-sm font-semibold">{info?.name ?? "Usuário"}</p>
                  <p className="text-xs text-soil-brown/50">Bloqueado em {formatDate(b.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => toggleBlock.mutate({ blockedId: b.blocked_id, existingId: b.id })}
                className="rounded-lg border border-soil-brown/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-soil-brown/5"
              >
                Desbloquear
              </button>
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
