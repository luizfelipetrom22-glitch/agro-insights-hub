import { Link } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  ALERT_CROPS,
  useMarginAlerts,
  useMarginThresholds,
  useToggleMarginAlert,
  type MarginCondition,
} from "@/hooks/use-margin-alerts";
import { formatPrice } from "@/lib/profit";

export function MarginAlerts() {
  const t = useMarginThresholds();
  const alerts = useMarginAlerts(t.userId);
  const toggle = useToggleMarginAlert(t.userId);

  const isOn = (c: MarginCondition) =>
    (alerts.data ?? []).some((a) => a.condition === c && a.active && a.commodity === t.crop);

  const rows: { c: MarginCondition; label: string; limit: number | undefined }[] = [
    { c: "abaixo_equilibrio", label: "Abaixo do meu ponto de equilíbrio", limit: t.breakeven },
    { c: "abaixo_meta", label: "Abaixo do preço da minha margem desejada", limit: t.target },
  ];

  return (
    <section className="border-b border-soil-brown/10 py-8">
      <div className="flex items-center gap-3">
        <BellRing className="size-5 text-clay" aria-hidden />
        <h2 className="font-serif text-2xl text-harvest-green">Alertas de margem</h2>
      </div>

      {!t.base ? (
        <p className="mt-4 text-sm text-soil-brown/60">
          Os alertas usam o custo real da sua safra.{" "}
          <Link to="/minha-producao" className="font-semibold text-harvest-green underline">
            Complete sua safra
          </Link>{" "}
          para ativá-los.
        </p>
      ) : !t.supported ? (
        <p className="mt-4 text-sm text-soil-brown/60">
          Alertas de margem estão disponíveis para {ALERT_CROPS.join(" e ")}. Sua cultura cadastrada é{" "}
          {t.crop}.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-soil-brown/60">
            Receba um aviso quando a referência de {t.crop} cair abaixo do que sua safra suporta.
            {t.price ? ` Referência agora: ${formatPrice(t.price)}/sc.` : ""}
          </p>
          <div className="mt-4 divide-y divide-soil-brown/10 rounded-2xl border border-soil-brown/10 bg-card">
            {rows.map((r) => {
              const below = t.price !== undefined && r.limit !== undefined && t.price < r.limit;
              return (
                <label key={r.c} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-soil-brown">{r.label}</p>
                    <p className="text-xs text-soil-brown/55">
                      Limite: {r.limit !== undefined ? formatPrice(r.limit) : "—"}/sc
                      {below && <span className="ml-2 font-semibold text-destructive">· abaixo agora</span>}
                    </p>
                  </div>
                  <Switch
                    checked={isOn(r.c)}
                    disabled={toggle.isPending}
                    onCheckedChange={(on) =>
                      toggle.mutate(
                        { crop: t.crop, condition: r.c, on },
                        {
                          onSuccess: () => toast.success(on ? "Alerta ativado" : "Alerta desativado"),
                          onError: (e) => toast.error(e.message),
                        },
                      )
                    }
                  />
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-soil-brown/45">
            Comparação com a cotação de bolsa convertida para R$/sc — referência de mercado, não preço
            local. No máximo um aviso por dia em "Avisos", verificado enquanto você usa a plataforma.
          </p>
        </>
      )}
    </section>
  );
}
