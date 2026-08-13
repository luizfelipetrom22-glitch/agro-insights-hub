import type { ReactNode } from "react";
import { RISK_STYLE, type RiskLevel } from "@/lib/safety";

export function RiskAlert({
  level,
  title,
  children,
}: {
  level: RiskLevel;
  title: string;
  children?: ReactNode;
}) {
  const icon = level === "alto" ? "⛔" : level === "atencao" ? "⚠️" : "🛡️";
  return (
    <div className={`rounded-xl border px-4 py-3 text-xs ${RISK_STYLE[level]}`} role="status">
      <p className="font-semibold">
        <span aria-hidden>{icon}</span> {title}
      </p>
      {children && <div className="mt-1 opacity-90">{children}</div>}
    </div>
  );
}
