import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Kind = "analyst" | "report";

/** Verifica o limite do plano Grátis e registra o uso. Premium passa direto. */
export async function checkAndLogUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: Kind,
  limit: number,
  windowDays: number,
  limitMessage: string,
) {
  const { data: plan } = await supabase.rpc("current_plan");
  if (plan !== "premium") {
    const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
    const { count } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", kind)
      .gte("created_at", since);
    if ((count ?? 0) >= limit) throw new Error(limitMessage);
  }
  await supabase.from("ai_usage").insert({ user_id: userId, kind });
}
