import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Notification = Tables<"notifications">;

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Notification[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const unread = (query.data ?? []).filter((n) => !n.read_at).length;

  return { ...query, unread };
}

export function useMarkNotificationsRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id?: string) => {
      let update = supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (id) update = update.eq("id", id);
      const { error } = await update;
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export async function notifyUser(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });
}