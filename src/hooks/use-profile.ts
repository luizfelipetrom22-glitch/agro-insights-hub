import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type UserType = "produtor" | "comprador";

export type SessionProfile = {
  userId: string;
  email: string | null;
  userType: UserType;
  profile: Tables<"profiles"> | null;
  buyerProfile: Tables<"buyer_profiles"> | null;
};

export async function fetchSessionProfile(): Promise<SessionProfile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: buyerProfile }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("buyer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const metaType = (user.user_metadata as Record<string, unknown> | null)?.["user_type"];
  const userType: UserType =
    profile?.user_type === "comprador" || buyerProfile
      ? "comprador"
      : metaType === "comprador"
        ? "comprador"
        : "produtor";

  return {
    userId: user.id,
    email: user.email ?? null,
    userType,
    profile: profile ?? null,
    buyerProfile: buyerProfile ?? null,
  };
}

export function useProfile() {
  return useQuery({
    queryKey: ["session-profile"],
    queryFn: fetchSessionProfile,
    staleTime: 30_000,
  });
}
