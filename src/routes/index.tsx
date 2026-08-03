import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraIntelligence — Inteligência de mercado para o agro" },
      {
        name: "description",
        content:
          "Preços de commodities, clima, cotações do dólar, notícias do agronegócio, calendário agrícola e relatórios gerados por IA em um só painel.",
      },
      { property: "og:title", content: "TerraIntelligence — Inteligência de mercado para o agro" },
      {
        property: "og:description",
        content:
          "Painel com cotações, clima, dólar, notícias do agronegócio e análises geradas por IA para o produtor rural brasileiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    title: "Cotações em tempo real",
    desc: "Soja, milho, boi gordo, café e dólar atualizados continuamente.",
  },
  {
    title: "Clima e calendário agrícola",
    desc: "Previsões por região e janelas de plantio e colheita das principais culturas.",
  },
  {
    title: "Notícias do agronegócio",
    desc: "Os fatos que movem o mercado, curados e resumidos para você.",
  },
  {
    title: "Relatórios gerados por IA",
    desc: "Análises sob medida: cultura, região e período que importam para a sua safra.",
  },
];

const premium = [
  "Alertas por WhatsApp",
  "Relatórios automáticos",
  "Previsão de custos da safra",
  "Simulador de lucro",
  "Comparação entre anos",
  "Exportação para Excel e PDF",
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-soil-brown">
      {/* Nav */}
      <header className="mx-auto flex max-w-[1200px] items-center justify-between p-6">
        <span className="font-serif text-2xl text-harvest-green">TerraIntelligence</span>
        <div className="flex items-center gap-4">
          <Link
            to={signedIn ? "/painel" : "/auth"}
            className="rounded-lg bg-harvest-green px-5 py-2.5 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90"
          >
            {signedIn ? "Meu painel" : "Entrar"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pt-12 pb-20">
        <div className="max-w-2xl">
          <span className="rounded-full border border-harvest-green/20 bg-harvest-green/5 px-3 py-1 text-xs font-semibold text-harvest-green">
            Inteligência de mercado para o produtor
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-tight sm:text-6xl">
            Tudo que move a sua safra, em um só painel.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-soil-brown/70">
            Reunimos cotações de commodities, clima, dólar, notícias, calendário
            agrícola e relatórios de IA para você decidir com confiança — e ainda
            recebe alertas por WhatsApp nos momentos certos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={signedIn ? "/painel" : "/auth"}
              className="rounded-lg bg-harvest-green px-6 py-3 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90"
            >
              {signedIn ? "Abrir painel" : "Começar grátis"}
            </Link>
            <a
              href="#recursos"
              className="rounded-lg border border-soil-brown/15 px-6 py-3 text-sm font-semibold transition-colors hover:bg-soil-brown/5"
            >
              Conhecer recursos
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="mx-auto max-w-[1200px] px-6 py-16">
        <h2 className="font-serif text-3xl">Tudo que você precisa, em um lugar</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-soil-brown/10 bg-card p-6"
            >
              <h3 className="font-serif text-2xl text-harvest-green">{f.title}</h3>
              <p className="mt-2 text-sm text-soil-brown/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium */}
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="rounded-3xl border border-clay/20 bg-clay/5 p-8 sm:p-12">
          <span className="rounded bg-clay px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-clay-foreground">
            Premium
          </span>
          <h2 className="mt-4 font-serif text-3xl">Leve a decisão para o próximo nível</h2>
          <p className="mt-2 max-w-xl text-sm text-soil-brown/70">
            Recursos avançados para quem vive do agronegócio e não pode perder o
            momento certo de agir.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {premium.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-harvest-green/15 text-xs text-harvest-green">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link
            to="/auth"
            className="mt-8 inline-block rounded-lg bg-clay px-6 py-3 text-sm font-semibold text-clay-foreground transition-colors hover:bg-clay/90"
          >
            Assinar agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-[1200px] px-6 py-10 text-sm text-soil-brown/50">
        © {new Date().getFullYear()} TerraIntelligence — Inteligência de mercado para o agro brasileiro.
      </footer>
    </div>
  );
}
