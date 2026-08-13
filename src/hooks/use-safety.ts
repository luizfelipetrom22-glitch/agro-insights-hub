import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { trustScore, type Trust } from "@/lib/safety";

export type AbuseReport = Tables<"abuse_reports">;
export type UserBlock = Tables<"user_blocks">;

export type ReportTarget = {
  targetType: "anuncio" | "usuario" | "mensagem" | "pedido";
  targetId?: string | null;
  reportedUserId?: string | null;
};

/** Denúncias abertas pelo próprio usuário. */
export function useMyReports(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-reports", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abuse_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AbuseReport[];
    },
  });
}

export function useCreateReport(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReportTarget & { reason: string; details?: string }) => {
      if (!userId) throw new Error("Entre na sua conta para denunciar.");
      const { error } = await supabase.from("abuse_reports").insert({
        reporter_id: userId,
        reported_user_id: input.reportedUserId ?? null,
        target_type: input.targetType,
        target_id: input.targetId ?? null,
        reason: input.reason,
        details: input.details?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Denúncia registrada. Nossa equipe vai analisar.");
      void queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar a denúncia."),
  });
}

export function useBlocks(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-blocks", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_blocks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserBlock[];
    },
  });
}

export function useToggleBlock(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { blockedId: string; existingId?: string | undefined }) => {
      if (!userId) throw new Error("Entre na sua conta.");
      if (input.existingId) {
        const { error } = await supabase.from("user_blocks").delete().eq("id", input.existingId);
        if (error) throw error;
        return "desbloqueado" as const;
      }
      const { error } = await supabase
        .from("user_blocks")
        .insert({ blocker_id: userId, blocked_id: input.blockedId });
      if (error) throw error;
      return "bloqueado" as const;
    },
    onSuccess: (action) => {
      toast.success(action === "bloqueado" ? "Usuário bloqueado." : "Bloqueio removido.");
      void queryClient.invalidateQueries({ queryKey: ["user-blocks"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir a ação."),
  });
}

/** Selo de confiança de um produtor, com denúncias abertas contabilizadas. */
export function useTrust(producerId: string | undefined) {
  return useQuery<Trust | null>({
    queryKey: ["trust", producerId],
    enabled: Boolean(producerId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ data: profile }, { count }, reports] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", producerId!).maybeSingle(),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", producerId!)
          .eq("status", "ativo"),
        supabase.rpc("open_reports_count", { _user_id: producerId! }),
      ]);
      if (!profile) return null;
      return trustScore({
        verified: profile.verified,
        hasAvatar: Boolean(profile.avatar_url),
        hasPhone: Boolean(profile.phone),
        hasFarmName: Boolean(profile.farm_name),
        hasLocation: Boolean(profile.city && profile.state),
        hasBio: Boolean(profile.bio),
        createdAt: profile.created_at,
        listingsCount: count ?? 0,
        openReports: (reports.data as number | null) ?? 0,
      });
    },
  });
}
