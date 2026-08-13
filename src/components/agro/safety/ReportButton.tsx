import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useCreateReport, type ReportTarget } from "@/hooks/use-safety";
import { REPORT_REASONS } from "@/lib/safety";

export function ReportButton({
  target,
  label = "Denunciar",
  className,
}: {
  target: ReportTarget;
  label?: string;
  className?: string;
}) {
  const { data: session } = useProfile();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const report = useCreateReport(session?.userId);

  if (!session) return null;
  if (target.reportedUserId && target.reportedUserId === session.userId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-xs font-semibold text-loss/80 underline-offset-4 hover:underline"}
      >
        ⚑ {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-soil-brown/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Denunciar"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              report.mutate(
                { ...target, reason, details },
                {
                  onSuccess: () => {
                    setOpen(false);
                    setDetails("");
                  },
                },
              );
            }}
            className="w-full max-w-md space-y-4 rounded-2xl border border-soil-brown/10 bg-card p-6 text-soil-brown"
          >
            <div>
              <h3 className="font-serif text-2xl">Denunciar</h3>
              <p className="mt-1 text-xs text-soil-brown/60">
                Sua denúncia é confidencial: o outro lado não é avisado de quem denunciou.
              </p>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
                Motivo
              </span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-soil-brown/15 bg-background px-3 py-2 text-sm outline-none focus:border-harvest-green"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
                O que aconteceu
              </span>
              <textarea
                rows={4}
                value={details}
                maxLength={1000}
                placeholder="Descreva o combinado, valores citados e qualquer pedido de pagamento antecipado."
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-lg border border-soil-brown/15 bg-background px-3 py-2 text-sm outline-none focus:border-harvest-green"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-soil-brown/15 px-4 py-2 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={report.isPending}
                className="rounded-lg bg-loss px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
              >
                {report.isPending ? "Enviando…" : "Enviar denúncia"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
