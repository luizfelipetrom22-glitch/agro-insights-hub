import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/agro/AppShell";
import { Avatar } from "@/components/agro/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import {
  formatTime,
  markConversationRead,
  sendMessage,
  type Conversation,
  type Message,
} from "@/lib/chat";
import { createSignedUrl, randomFileName } from "@/lib/storage";

type Search = { conversa?: string };

export const Route = createFileRoute("/_authenticated/mensagens")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search["conversa"] === "string" ? { conversa: search["conversa"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Mensagens — TerraIntelligence" },
      {
        name: "description",
        content:
          "Converse diretamente com compradores e produtores, envie fotos e documentos das negociações.",
      },
      { property: "og:title", content: "Mensagens — TerraIntelligence" },
      {
        property: "og:description",
        content: "Negocie em tempo real com compradores e produtores do marketplace.",
      },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { conversa } = Route.useSearch();
  const navigate = useNavigate();
  const { data: session } = useProfile();
  const queryClient = useQueryClient();
  const userId = session?.userId;

  const conversations = useQuery({
    queryKey: ["conversations", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
  });

  const list = conversations.data ?? [];
  const activeId = conversa ?? list[0]?.id;
  const active = list.find((c) => c.id === activeId) ?? null;

  const counterpartIds = useMemo(
    () => list.map((c) => (c.buyer_id === userId ? c.producer_id : c.buyer_id)),
    [list, userId],
  );

  const names = useQuery({
    queryKey: ["conversation-names", counterpartIds.slice().sort().join("|")],
    enabled: counterpartIds.length > 0,
    queryFn: async () => {
      const [{ data: profiles }, { data: buyers }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, farm_name, avatar_url")
          .in("user_id", counterpartIds),
        supabase
          .from("buyer_profiles")
          .select("user_id, full_name, company, avatar_url")
          .in("user_id", counterpartIds),
      ]);
      const map: Record<string, { name: string; avatar: string | null }> = {};
      for (const p of profiles ?? []) {
        map[p.user_id] = {
          name: p.farm_name || p.full_name || "Participante",
          avatar: p.avatar_url,
        };
      }
      for (const b of buyers ?? []) {
        map[b.user_id] = {
          name: b.company || b.full_name || map[b.user_id]?.name || "Participante",
          avatar: b.avatar_url ?? map[b.user_id]?.avatar ?? null,
        };
      }
      return map;
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`messages-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages"] });
        void queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return (
    <AppShell>
      <header>
        <h2 className="font-serif text-3xl text-harvest-green">Mensagens</h2>
        <p className="mt-1 text-sm text-soil-brown/60">
          Negocie diretamente, envie fotos e documentos. Tudo fica salvo no histórico.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-2 rounded-2xl border border-soil-brown/10 bg-card p-3">
          {list.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-soil-brown/50">
              Nenhuma conversa ainda. Comece pelo botão “Falar com o vendedor” em um anúncio.
            </p>
          )}
          {list.map((c) => {
            const other = c.buyer_id === userId ? c.producer_id : c.buyer_id;
            const info = names.data?.[other];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => void navigate({ to: "/mensagens", search: { conversa: c.id } })}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  c.id === activeId ? "bg-harvest-green/10" : "hover:bg-soil-brown/5"
                }`}
              >
                <Avatar path={info?.avatar ?? null} name={info?.name} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {info?.name ?? "Participante"}
                  </span>
                  <span className="line-clamp-1 block text-xs text-soil-brown/55">
                    {c.last_message ?? "Conversa iniciada"}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        {active ? (
          <Thread
            conversation={active}
            userId={userId!}
            title={
              names.data?.[active.buyer_id === userId ? active.producer_id : active.buyer_id]
                ?.name ?? "Participante"
            }
            avatarPath={
              names.data?.[active.buyer_id === userId ? active.producer_id : active.buyer_id]
                ?.avatar ?? null
            }
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-soil-brown/20 p-12 text-center text-sm text-soil-brown/50">
            Selecione uma conversa para ver as mensagens.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Thread({
  conversation,
  userId,
  title,
  avatarPath,
}: {
  conversation: Conversation;
  userId: string;
  title: string;
  avatarPath: string | null;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({
    queryKey: ["messages", conversation.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    void markConversationRead(conversation.id, userId);
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.id, userId, messages.data?.length]);

  const send = useMutation({
    mutationFn: async (payload: {
      body?: string;
      attachment?: { url: string; name: string; type: string };
    }) =>
      sendMessage({
        conversationId: conversation.id,
        senderId: userId,
        ...(payload.body ? { body: payload.body } : {}),
        ...(payload.attachment ? { attachment: payload.attachment } : {}),
      }),
    onSuccess: () => {
      setText("");
      void queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a mensagem."),
  });

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 10 MB).");
      return;
    }
    setUploading(true);
    try {
      const path = `${conversation.id}/${randomFileName(file.name)}`;
      const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
      if (error) throw error;
      await send.mutateAsync({
        attachment: { url: path, name: file.name, type: file.type || "application/octet-stream" },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar o arquivo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="flex h-[600px] flex-col rounded-2xl border border-soil-brown/10 bg-card">
      <header className="flex items-center gap-3 border-b border-soil-brown/10 px-5 py-3">
        <Avatar path={avatarPath} name={title} size={36} />
        <p className="font-serif text-lg">{title}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {(messages.data ?? []).map((m) => (
          <MessageBubble key={m.id} message={m} mine={m.sender_id === userId} />
        ))}
        {messages.data?.length === 0 && (
          <p className="py-10 text-center text-sm text-soil-brown/50">
            Envie a primeira mensagem para iniciar a negociação.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t border-soil-brown/10 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          send.mutate({ body: text });
        }}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Anexar arquivo"
          className="rounded-lg border border-soil-brown/15 px-3 py-2.5 text-sm text-soil-brown/60 transition-colors hover:text-clay disabled:opacity-50"
        >
          {uploading ? "…" : "📎"}
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua mensagem"
          maxLength={2000}
          className="flex-1 rounded-lg border border-soil-brown/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-harvest-green"
        />
        <button
          type="submit"
          disabled={send.isPending || !text.trim()}
          className="rounded-lg bg-harvest-green px-4 py-2.5 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}

function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!message.attachment_url) return;
    let cancelled = false;
    void createSignedUrl("chat-attachments", message.attachment_url).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => {
      cancelled = true;
    };
  }, [message.attachment_url]);

  const isImage = message.attachment_type?.startsWith("image/");

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          mine
            ? "bg-harvest-green text-harvest-green-foreground"
            : "border border-soil-brown/10 bg-background text-soil-brown"
        }`}
      >
        {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
        {message.attachment_url && (
          <div className="mt-1">
            {isImage && url ? (
              <img
                src={url}
                alt={message.attachment_name ?? "Anexo"}
                className="max-h-56 rounded-lg"
                loading="lazy"
              />
            ) : (
              <a
                href={url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                📄 {message.attachment_name ?? "Documento"}
              </a>
            )}
          </div>
        )}
        <p className={`mt-1 text-[10px] ${mine ? "opacity-70" : "text-soil-brown/40"}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}