export const FREE_LIMITS = {
  scenarios: 1,
  analystPerDay: 3,
  reportsPerMonth: 1,
} as const;

export const PLAN_FEATURES = {
  free: [
    "Cotações, dólar, clima e notícias",
    "Calendário agrícola",
    "Cadastro da safra e Radar de Lucro",
    "Marketplace, mensagens e segurança",
    `${FREE_LIMITS.scenarios} cenário salvo no simulador`,
    `${FREE_LIMITS.analystPerDay} perguntas por dia ao Analista`,
    `${FREE_LIMITS.reportsPerMonth} relatório da safra por mês`,
  ],
  premium: [
    "Tudo do plano Grátis",
    "Cenários ilimitados e comparação lado a lado",
    "Analista da safra sem limite",
    "Alertas de margem (soja e milho)",
    "Relatórios da safra ilimitados",
    "Exportação em PDF e Excel",
  ],
};
