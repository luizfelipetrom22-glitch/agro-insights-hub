import { RISK_STYLE, type Trust } from "@/lib/safety";

export function TrustBadge({ trust, compact }: { trust: Trust | null | undefined; compact?: boolean }) {
  if (!trust) return null;
  const icon = trust.level === "ok" ? "🛡️" : trust.level === "atencao" ? "⚠️" : "⛔";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${RISK_STYLE[trust.level]}`}
      title={trust.reasons.join(" · ")}
    >
      <span aria-hidden>{icon}</span>
      <span>{trust.label}</span>
      {!compact && <span className="opacity-70">{trust.score}/100</span>}
    </div>
  );
}

export function TrustDetails({ trust }: { trust: Trust | null | undefined }) {
  if (!trust) return null;
  return (
    <ul className="mt-3 space-y-1 text-xs text-soil-brown/60">
      {trust.reasons.map((r) => (
        <li key={r}>• {r}</li>
      ))}
    </ul>
  );
}
