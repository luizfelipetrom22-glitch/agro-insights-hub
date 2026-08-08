import { NotificationBell } from "./NotificationBell";
import { Avatar } from "./Avatar";
import { useProfile } from "@/hooks/use-profile";
import { useTickers, useWeather } from "@/hooks/use-market";

type Item = {
  label: string;
  value: string;
  change: string | null;
  dir: "up" | "down" | "flat";
  hint?: string | undefined;
};

export function MarketBar({ onHelp }: { onHelp?: () => void }) {
  const { data: session } = useProfile();
  const market = useTickers();
  const weather = useWeather(
    session?.profile?.city ?? session?.buyerProfile?.city ?? null,
    session?.profile?.state ?? session?.buyerProfile?.state ?? null,
  );
  const avatarPath = session?.profile?.avatar_url ?? session?.buyerProfile?.avatar_url ?? null;
  const displayName =
    session?.profile?.full_name ?? session?.buyerProfile?.full_name ?? session?.email ?? null;

  const items: Item[] = [...(market.data?.tickers ?? [])];
  if (weather.data) {
    items.push({
      label: `Clima (${weather.data.place})`,
      value: `${weather.data.temperature}°C ${weather.data.description}`,
      change: null,
      dir: "flat",
      hint:
        weather.data.max !== null
          ? `Mín ${Math.round(weather.data.min ?? 0)}° / Máx ${Math.round(weather.data.max)}° · Chuva ${weather.data.rain ?? 0} mm`
          : undefined,
    });
  }
  const updated = market.data?.updatedAt
    ? new Date(market.data.updatedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      data-tour="market-bar"
      className="sticky top-0 z-50 flex items-center justify-between border-b border-harvest-green-foreground/10 bg-harvest-green px-6 py-2.5 text-xs font-medium text-harvest-green-foreground"
    >
      <div className="flex gap-8 overflow-x-auto">
        {items.length === 0 && (
          <span className="opacity-60">
            {market.isError ? "Cotações indisponíveis agora" : "Carregando cotações…"}
          </span>
        )}
        {items.map((t) => (
          <div key={`${t.label}-${t.value}`} className="flex items-center gap-2 whitespace-nowrap" title={t.hint}>
            <span className="uppercase tracking-wider opacity-60">{t.label}</span>
            <span
              className={
                t.dir === "up"
                  ? "font-semibold text-gain"
                  : t.dir === "down"
                    ? "font-semibold text-loss"
                    : "font-semibold"
              }
            >
              {t.value}
            </span>
            {t.change && (
              <span
                className={`rounded px-1 text-[10px] ${
                  t.dir === "up"
                    ? "bg-gain/20"
                    : t.dir === "down"
                      ? "bg-loss/20"
                      : "bg-harvest-green-foreground/10"
                }`}
              >
                {t.change}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="hidden shrink-0 items-center gap-4 pl-6 md:flex">
        {updated && <span className="opacity-50">Atualizado {updated}</span>}
        <NotificationBell />
        <div className="h-4 w-px bg-harvest-green-foreground/20" />
        <button
          onClick={onHelp}
          className="transition-colors hover:text-clay"
        >
          Ajuda
        </button>
        {session && (
          <a href="/perfil" aria-label="Meu perfil" className="flex items-center">
            <Avatar path={avatarPath} name={displayName} size={26} />
          </a>
        )}
      </div>
    </div>
  );
}