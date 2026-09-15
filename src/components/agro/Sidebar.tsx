import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, CalendarDays, FileText, LayoutDashboard, MessageSquare, PackageOpen, ShieldCheck, Sprout, UserRound } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

type NavItem = { label: string; to: string; premium?: boolean; icon: typeof LayoutDashboard; group?: string };

const producerNav: NavItem[] = [
  { label: "Visão Geral", to: "/painel", icon: LayoutDashboard, group: "Decisão financeira" },
  { label: "Minha Produção", to: "/minha-producao", icon: Sprout },
  { label: "Simular Decisão", to: "/simulador", premium: true, icon: BarChart3 },
  { label: "Análises IA", to: "/relatorios", icon: FileText },
  { label: "Meus Anúncios", to: "/anuncios", icon: PackageOpen, group: "Comercialização" },
  { label: "Pedidos de Compra", to: "/pedidos", icon: FileText },
  { label: "Mensagens", to: "/mensagens", icon: MessageSquare },
  { label: "Calendário Agrícola", to: "/calendario", icon: CalendarDays, group: "Apoio" },
  { label: "Segurança", to: "/seguranca", icon: ShieldCheck },
  { label: "Meu Perfil", to: "/perfil", icon: UserRound },
];

const buyerNav: NavItem[] = [
  { label: "Painel do Comprador", to: "/comprador", icon: LayoutDashboard },
  { label: "Buscar Produtos", to: "/buscar", icon: PackageOpen },
  { label: "Favoritos", to: "/favoritos", icon: Sprout },
  { label: "Meus Pedidos", to: "/pedidos", icon: FileText },
  { label: "Mensagens", to: "/mensagens", icon: MessageSquare },
  { label: "Relatórios IA", to: "/relatorios", icon: BarChart3 },
  { label: "Alertas de Preço", to: "/simulador", premium: true, icon: CalendarDays },
  { label: "Segurança", to: "/seguranca", icon: ShieldCheck },
  { label: "Meu Perfil", to: "/perfil", icon: UserRound },
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
            : "Inteligência para proteger sua margem"}
        </p>
      </div>

      <div className="inline-flex rounded-full bg-soil-brown/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-soil-brown/60">
        {isBuyer ? "Comprador" : "Produtor"}
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <div key={item.to}>
              {item.group && <p className="mb-2 mt-5 px-4 text-[10px] font-bold uppercase tracking-widest text-soil-brown/35">{item.group}</p>}
            <Link
              to={item.to}
              className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                active
                  ? "bg-harvest-green font-medium text-harvest-green-foreground"
                  : "text-soil-brown/70 hover:bg-soil-brown/5"
              }`}
            >
              <span className="flex items-center gap-3"><Icon className="size-4" aria-hidden />{item.label}</span>
              {item.premium && (
                <span className="rounded bg-clay px-1.5 py-0.5 text-[10px] uppercase tracking-tighter text-clay-foreground">
                  Premium
                </span>
              )}
            </Link>
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
