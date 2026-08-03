import soy from "@/assets/news-soy.jpg";
import port from "@/assets/news-port.jpg";
import machinery from "@/assets/news-machinery.jpg";

const news = [
  {
    img: soy,
    alt: "Vagens de soja na planta",
    title: "Mato Grosso atinge 95% da colheita de soja",
    note: "Rendimento médio supera expectativas nas regiões norte...",
  },
  {
    img: port,
    alt: "Navio cargueiro em porto comercial",
    title: "Logística: Fretes para Paranaguá sobem 8%",
    note: "Demanda por transporte rodoviário pressiona custos de escoamento...",
  },
  {
    img: machinery,
    alt: "Maquinário agrícola ao pôr do sol",
    title: "Novos subsídios para máquinas agrícolas",
    note: "Governo anuncia linha de crédito especial para agricultura 4.0...",
  },
];

export function InsightAndNews() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-serif text-xl">
          Análise de Mercado IA
          <span className="rounded-full border border-harvest-green/20 px-2 py-0.5 text-[10px] text-harvest-green">
            Gerado agora
          </span>
        </h3>
        <div className="group cursor-pointer rounded-2xl border border-soil-brown/10 bg-card p-6 transition-colors hover:border-clay/40">
          <div className="mb-4 flex items-start justify-between">
            <h4 className="font-semibold transition-colors group-hover:text-clay">
              Impacto da seca na Argentina no preço local
            </h4>
            <span className="text-xs text-soil-brown/40">10 min atrás</span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-soil-brown/70">
            Nossa IA detectou uma quebra de safra 12% maior que o esperado na região de Rosário.
            Isso sugere uma pressão de alta no prêmio de exportação para abril...
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-harvest-green">
            <span className="flex items-center gap-1.5">Alerta WhatsApp ativo</span>
            <span className="text-soil-brown/20">|</span>
            <span>Ver relatório completo</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-xl">Últimas do Agronegócio</h3>
        <div className="space-y-px overflow-hidden rounded-2xl border border-soil-brown/10 bg-soil-brown/5">
          {news.map((n) => (
            <div key={n.title} className="flex gap-4 bg-card p-4">
              <img
                src={n.img}
                alt={n.alt}
                loading="lazy"
                width={512}
                height={512}
                className="size-16 shrink-0 rounded-lg object-cover"
              />
              <div>
                <h5 className="mb-1 text-sm font-semibold">{n.title}</h5>
                <p className="text-xs text-soil-brown/50">{n.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}