import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ProducerSeason = Tables<"producer_seasons">;

export const seasonQueryKey = (userId?: string) => ["producer-season", userId ?? ""];

export function useProducerSeason(userId?: string) {
  return useQuery({
    queryKey: seasonQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_seasons")
        .select("*")
        .eq("user_id", userId ?? "")
        .maybeSingle();
      if (error) throw error;
      return data as ProducerSeason | null;
    },
  });
}

export function seasonCompleteness(season: ProducerSeason | null | undefined) {
  const checks = [
    { label: "safra", done: Boolean(season?.season_name?.trim()) },
    { label: "cultura", done: Boolean(season?.crop?.trim()) },
    { label: "área", done: Number(season?.area_hectares) > 0 },
    { label: "produtividade", done: Number(season?.expected_yield_bags_ha) > 0 },
    {
      label: "custos",
      done:
        [
          season?.seeds_fertilizers_cost_ha,
          season?.operation_cost_ha,
          season?.harvest_cost_ha,
          season?.freight_storage_cost_ha,
          season?.land_cost_ha,
        ].some((value) => value !== null && value !== undefined),
    },
    { label: "margem desejada", done: season?.target_margin_pct !== null && season?.target_margin_pct !== undefined },
  ];
  const done = checks.filter((item) => item.done).length;
  return {
    checks,
    done,
    total: checks.length,
    percentage: Math.round((done / checks.length) * 100),
    complete: done === checks.length,
  };
}