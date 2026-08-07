import { Link, useRouterState } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";

type NavItem = { label: string; to: string; premium?: boolean };

const producerNav: NavItem[] = [
  { label: "Painel Geral", to: "/painel" },
  { label: "Meus Anúncios", to: "/anuncios" },
  { label: "Pedidos de Compra", to: "/pedidos" },
  { label: "Mensagens", to: "/mensagens" },
  { label: "Calendário Agrícola", to: "/calendario" },
  { label: "Relatórios IA", to: "/relatorios" },
  { label: "Simulador de Lucro", to: "/simulador", premium: true },
  { label: "Meu Perfil", to: "/perfil" },
];

const buyerNav: NavItem[] = [
  { label: "Painel do Comprador", to: "/comprador" },
  { label: "Buscar Produtos", to: "/buscar" },
  { label: "Favoritos", to: "/favoritos" },
  { label: "Meus Pedidos", to: "/pedidos" },
  { label: "Mensagens", to: "/mensagens" },
  { label: "Relatórios IA", to: "/relatorios" },
  { label: "Alertas de Preço", to: "/simulador", premium: true },
  { label: "Meu Perfil", to: "/perfil" },
];

const events = [
  { month: "MAR", day: "15", title: "Início Plantio Safrinha", note: "Previsão de chuva ideal" },
  { month: "MAR", day: "22", title: "Relatório USDA", note: "Projeção global de estoques" },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: session } = useProfile();
  const isBuyer = session?.userType === "comprador";
  const nav = isBuyer ? buyerNav : producerNav;

  return (
    <aside data-tour="sidebar" className="col-span-12 space-y-8 lg:col-span-3">
      <div>
        <h1 className="mb-1 font-serif text-3xl text-harvest-green">TerraIntelligence</h1>
        <p className="font-serif text-sm italic text-soil-brown/60">
          {isBuyer
            ? "Marketplace agrícola para compradores"
            : "Inteligência de mercado para o produtor moderno"}
        </p>
      </div>

      <div className="inline-flex rounded-full bg-soil-brown/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-soil-brown/60">
        {isBuyer ? "🛒 Comprador" : "🌾 Produtor"}
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                active
                  ? "bg-harvest-green font-medium text-harvest-green-foreground"
                  : "text-soil-brown/70 hover:bg-soil-brown/5"
              }`}
            >
              <span>{item.label}</span>
              {item.premium && (
                <span className="rounded bg-clay px-1.5 py-0.5 text-[10px] uppercase tracking-tighter text-clay-foreground">
                  Premium
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-soil-brown/10 bg-card p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-soil-brown/40">
          Próximos Eventos
        </h3>
        <div className="space-y-4">
          {events.map((e) => (
            <div key={e.title} className="flex gap-4">
              <div className="text-center">
                <span className="block text-xs font-bold text-clay">{e.month}</span>
                <span className="block font-serif text-lg leading-none">{e.day}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-soil-brown/50">{e.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
