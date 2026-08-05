import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { data: session } = useProfile();
  const { data: notifications, unread } = useNotifications(session?.userId);
  const markRead = useMarkNotificationsRead(session?.userId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!session?.userId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-1.5 transition-colors hover:text-clay"
      >
        <span aria-hidden>🔔</span>
        <span className="hidden sm:inline">Avisos</span>
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-clay-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar notificações"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-3 max-h-96 w-80 overflow-y-auto rounded-2xl border border-soil-brown/10 bg-card p-2 text-soil-brown shadow-xl">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-soil-brown/40">
                Notificações
              </span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markRead.mutate(undefined)}
                  className="text-xs font-semibold text-harvest-green hover:underline"
                >
                  Marcar todas
                </button>
              )}
            </div>

            {(notifications ?? []).length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-soil-brown/50">
                Nenhuma notificação por enquanto.
              </p>
            )}

            {(notifications ?? []).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  markRead.mutate(n.id);
                  setOpen(false);
                  if (n.link) void navigate({ to: n.link });
                }}
                className={`block w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-soil-brown/5 ${
                  n.read_at ? "opacity-60" : ""
                }`}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body && <p className="line-clamp-2 text-xs text-soil-brown/60">{n.body}</p>}
                <p className="mt-1 text-[11px] text-soil-brown/40">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}