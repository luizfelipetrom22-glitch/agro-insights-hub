import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export type Plan = "free" | "premium";

export function usePlan() {
  const { data: session } = useProfile();
  const q = useQuery({
    queryKey: ["plan", session?.userId ?? ""],
    enabled: Boolean(session?.userId),
    queryFn: async (): Promise<Plan> => {
      const { data, error } = await supabase.rpc("current_plan");
      if (error) throw error;
      return data === "premium" ? "premium" : "free";
    },
  });
  const plan: Plan = q.data ?? "free";
  return { plan, isPremium: plan === "premium", isLoading: q.isLoading };
}
