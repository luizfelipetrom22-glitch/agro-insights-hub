import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;

export type ConversationTarget = {
  buyerId: string;
  producerId: string;
  listingId?: string | null;
  requestId?: string | null;
};

/** Encontra a conversa existente entre as duas partes (por anúncio) ou cria uma nova. */
export async function getOrCreateConversation(target: ConversationTarget): Promise<Conversation> {
  let query = supabase
    .from("conversations")
    .select("*")
    .eq("buyer_id", target.buyerId)
    .eq("producer_id", target.producerId);

  query = target.listingId ? query.eq("listing_id", target.listingId) : query.is("listing_id", null);

  const { data: existing, error: findError } = await query.maybeSingle();
  if (findError) throw findError;
  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      buyer_id: target.buyerId,
      producer_id: target.producerId,
      listing_id: target.listingId ?? null,
      request_id: target.requestId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body?: string;
  attachment?: { url: string; name: string; type: string } | null;
}): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    body: input.body?.trim() || null,
    attachment_url: input.attachment?.url ?? null,
    attachment_name: input.attachment?.name ?? null,
    attachment_type: input.attachment?.type ?? null,
  });
  if (error) throw error;
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}