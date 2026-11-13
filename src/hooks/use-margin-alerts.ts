import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useTickers } from "@/hooks/use-market";
import { seasonCompleteness, useProducerSeason } from "@/hooks/use-producer-season";
import { seasonFinancialBase } from "@/lib/profit";
import { buildMarginAlert, type MarginCondition } from "@/lib/margin-alert-message";

/** Culturas com alerta de margem disponível (têm cotação de referência). */
export const ALERT_CROPS = ["Soja", "Milho"] as const;
export type { MarginCondition };

const alertsKey = (userId?: string) => ["margin-alerts", userId ?? ""];

export function useMarginAlerts(userId?: string) {
  return useQuery({
    queryKey: alertsKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId ?? "")
        .in("condition", ["abaixo_equilibrio", "abaixo_meta"]);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleMarginAlert(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { crop: string; condition: MarginCondition; on: boolean }) => {
      if (!userId) throw new Error("Sessão expirada");
      await supabase
        .from("alerts")
        .delete()
        .eq("user_id", userId)
        .eq("condition", input.condition);
      if (input.on) {
        const { error } = await supabase.from("alerts").insert({
          user_id: userId,
          commodity: input.crop,
          condition: input.condition,
          threshold: 0, // calculado a cada verificação a partir da safra
          active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: alertsKey(userId) }),
  });
}

/** Limites da safra: ponto de equilíbrio e preço da meta. */
export function useMarginThresholds() {
  const { data: session } = useProfile();
  const season = useProducerSeason(session?.userId);
  const tickers = useTickers();
  const base = seasonCompleteness(season.data).complete ? seasonFinancialBase(season.data) : null;
  const crop = season.data?.crop ?? "";
  const ticker = (tickers.data?.tickers ?? []).find((t) => t.label === crop);
  const supported = (ALERT_CROPS as readonly string[]).includes(crop);
  return {
    userId: session?.userId,
    crop,
    supported,
    base,
    price: ticker?.numeric,
    breakeven: base?.costPerBag,
    target: base?.targetPrice,
  };
}

/** Verifica os alertas ativos e registra no máximo um aviso por condição por dia. */
export function useMarginAlertWatcher() {
  const t = useMarginThresholds();
  const alerts = useMarginAlerts(t.userId);
  const qc = useQueryClient();

  useEffect(() => {
    const { userId, crop, supported, base, price, breakeven, target } = t;
    if (!userId || !supported || !base || !price || !breakeven || !target) return;
    const active = (alerts.data ?? []).filter((a) => a.active && a.commodity === crop);
    if (!active.length) return;

    void (async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      for (const alert of active) {
        const msg = buildMarginAlert(alert.condition as MarginCondition, crop, price, base);
        if (!msg) continue;
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("type", msg.type)
          .gte("created_at", startOfDay.toISOString())
          .limit(1);
        if (existing?.length) continue;
        await supabase.from("notifications").insert({ user_id: userId, ...msg });
      }
      void qc.invalidateQueries({ queryKey: ["notifications", userId] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.userId, t.crop, t.price, t.breakeven, t.target, alerts.data]);
}
