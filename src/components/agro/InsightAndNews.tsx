import { useAgroNews, useMarketInsight } from "@/hooks/use-market";

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;
  return date.toLocaleDateString("pt-BR");
}

export function InsightAndNews() {
  const insight = useMarketInsight();
  const news = useAgroNews();

  return (
    <div
      data-tour="insight-news"
      className="grid grid-cols-1 gap-8 md:grid-cols-2"
    >
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-serif text-xl">
          Leitura geral do mercado
          <span className="rounded-full border border-harvest-green/20 px-2 py-0.5 text-[10px] text-harvest-green">
            {insight.isFetching ? "Gerando…" : "Atualizado"}
          </span>
        </h3>
        <div className="rounded-2xl border border-soil-brown/10 bg-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <h4 className="font-semibold">O que está movendo o mercado</h4>
            <span className="text-xs text-soil-brown/40">
              {insight.data?.updatedAt ? relativeTime(insight.data.updatedAt) : ""}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-soil-brown/70">
            {insight.isLoading
              ? "Lendo as cotações do momento…"
              : (insight.data?.text ??
                "Não foi possível gerar a análise agora. As cotações continuam atualizando na barra do topo.")}
          </p>
          <p className="mt-4 border-t border-soil-brown/10 pt-3 text-[11px] text-soil-brown/45">Análise geral. Ainda não considera os dados financeiros da sua propriedade.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-xl">Últimas do Agronegócio</h3>
        <div className="space-y-px overflow-hidden rounded-2xl border border-soil-brown/10 bg-soil-brown/5">
          {news.isLoading && (
            <p className="bg-card p-4 text-sm text-soil-brown/50">Buscando notícias…</p>
          )}
          {!news.isLoading && (news.data ?? []).length === 0 && (
            <p className="bg-card p-4 text-sm text-soil-brown/50">
              Nenhuma notícia disponível no momento.
            </p>
          )}
          {(news.data ?? []).map((n, i) => (
            <a
              key={`${n.link}-${i}`}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card p-4 transition-colors hover:bg-soil-brown/5"
            >
              <h5 className="mb-1 text-sm font-semibold">{n.title}</h5>
              <p className="text-xs text-soil-brown/50">
                {n.source}
                {n.publishedAt ? ` · ${relativeTime(n.publishedAt)}` : ""}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}