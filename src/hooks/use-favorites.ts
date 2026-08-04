import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Favorite = Tables<"favorites">;

export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ["favorites", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Favorite[];
    },
  });
}

export function useToggleFavorite(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: { listingId?: string; producerId?: string; existingId?: string }) => {
      if (target.existingId) {
        const { error } = await supabase.from("favorites").delete().eq("id", target.existingId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("favorites").insert({
        user_id: userId!,
        listing_id: target.listingId ?? null,
        producer_id: target.producerId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
