import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Verificação agendada dos alertas de margem (roda mesmo com o app fechado). */
export const Route = createFileRoute("/api/public/cron/margin-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { fetchTickers } = await import("@/lib/market.server");
        const { seasonFinancialBase } = await import("@/lib/profit");
        const { buildMarginAlert } = await import("@/lib/margin-alert-message");

        const { data: alerts, error } = await supabaseAdmin
          .from("alerts")
          .select("user_id, commodity, condition")
          .eq("active", true)
          .in("condition", ["abaixo_equilibrio", "abaixo_meta"])
          .limit(1000);
        if (error) return Response.json({ ok: false, error: "alerts" }, { status: 500 });
        if (!alerts?.length) return Response.json({ ok: true, sent: 0 });

        const userIds = [...new Set(alerts.map((a) => a.user_id))];
        const [{ data: plans }, { data: seasons }, market] = await Promise.all([
          supabaseAdmin.from("user_plans").select("user_id, plan").in("user_id", userIds),
          supabaseAdmin.from("producer_seasons").select("*").in("user_id", userIds),
          fetchTickers(),
        ]);
        const premium = new Set((plans ?? []).filter((p) => p.plan === "premium").map((p) => p.user_id));
        const seasonBy = new Map((seasons ?? []).map((s) => [s.user_id, s]));

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        let sent = 0;

        for (const alert of alerts) {
          if (!premium.has(alert.user_id)) continue;
          const season = seasonBy.get(alert.user_id);
          if (!season || season.crop !== alert.commodity) continue;
          const base = seasonFinancialBase(season);
          const price = market.tickers.find((t) => t.label === alert.commodity)?.numeric;
          if (!base || !price) continue;
          const msg = buildMarginAlert(
            alert.condition as "abaixo_equilibrio" | "abaixo_meta",
            alert.commodity,
            price,
            base,
          );
          if (!msg) continue;
          const { data: existing } = await supabaseAdmin
            .from("notifications")
            .select("id")
            .eq("user_id", alert.user_id)
            .eq("type", msg.type)
            .gte("created_at", startOfDay.toISOString())
            .limit(1);
          if (existing?.length) continue;
          const { error: insErr } = await supabaseAdmin
            .from("notifications")
            .insert({ user_id: alert.user_id, ...msg });
          if (!insErr) sent++;
        }
        return Response.json({ ok: true, sent });
      },
    },
  },
});
