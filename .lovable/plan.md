# Plano: Evoluir o TerraIntelligence para um SaaS completo

Hoje o site é um protótipo visual estático: todos os dados são fixos, não há login, não há banco, o menu e os botões não funcionam. Este plano transforma o protótipo em um SaaS real, em 5 fases que devem ser executadas em ordem.

## Fase 1 — Fundação: Login e Banco de Dados

**Ativar Lovable Cloud** (provisiona banco PostgreSQL + autenticação, sem contas externas).

- Criar schema do banco com migração:
  - `profiles` — dados do produtor (nome, fazenda, cidade, UF, culturas)
  - `simulations` — simulações de lucro salvas pelo usuário (cultura, área, custos, preço, resultado)
  - `alerts` — alertas configurados por WhatsApp (commodity, condição, telefone)
  - `reports` — relatórios de IA gerados e salvos por safra
  - `user_roles` + função `has_role()` — separa usuários de admins (estrutura de segurança padrão)
  - GRANTs + RLS em todas as tabelas (escopo por `auth.uid()`)
- Autenticação: tela de login/cadastro (email + senha, e opcional Google/Apple) usando o fluxo gerenciado do Cloud
- Rota `_authenticated/` com gate que redireciona não logados para `/auth`
- Dashboard passa a exigir sessão; a landing inicial (`/`) vira página pública de apresentação do produto

## Fase 2 — Navegação e Páginas Reais

Transformar o menu lateral (hoje `<a href="#">`) em rotas reais com TanStack Router:

```
src/routes/
  __root.tsx                  layout público (MarketBar + Outlet)
  index.tsx                   landing pública (hero + features + CTA)
  auth.tsx                    login/cadastro
  _authenticated/
    route.tsx                 gate + layout autenticado (Sidebar + Outlet)
    dashboard.tsx             /painel        — Painel Geral (cotações, clima, IA)
    calendario.tsx            /calendario     — Calendário Agrícola
    relatorios.tsx            /relatorios     — Relatórios IA
    simulador.tsx             /simulador      — Simulador de Lucro (Premium)
```

- Cada rota com `head()` próprio (title, description, og)
- Sidebar usa `<Link to=...>` com estado ativo
- Componentes existentes (PremiumSimulation, InsightAndNews, HistoricalComparison) são redistribuídos nas rotas apropriadas

## Fase 3 — Dados Reais via APIs

Substituir mocks por dados reais via server functions (`createServerFn`):

- **Cotações de commodities e dólar**: API de mercado (ex.: commodity API ou cotação BRL/USD)
- **Clima**: API de previsão do tempo por cidade/geolocalização
- **Notícias do agronegócio**: feed de notícias ou scraping de portais do agro
- MarketBar passa a exibir dados ao vivo, atualizados periodicamente
- Relatórios de IA usam o Lovable AI Gateway para gerar análises de mercado sob demanda

## Fase 4 — Recursos Premium Funcionais

Tudo atrás de assinatura ativa (gate por `user_roles` ou status de assinatura):

- **Simulador de Lucro** (`/simulador`): inputs reais (cultura, área, insumos, preço, câmbio) → calcula break-even, margem e ROI; salva simulações no banco
- **Comparação entre anos**: gráficos reais (Recharts) comparando safras com dados do banco
- **Alertas por WhatsApp**: configuração de gatilho (ex.: "soja > R$ X") + envio via gateway de WhatsApp (Twilio ou similar via connector/segredo)
- **Relatórios automáticos**: agendamento (cron via rota `/api/public/cron`) que gera e envia relatório periódico
- **Exportação**: botões funcionais de Excel (xlsx) e PDF (jsPDF) nas simulações e relatórios

## Fase 5 — Assinaturas Pagas

- Verificar elegibilidade do provedor (`recommend_payment_provider`) — produto é SaaS digital global, provavelmente Paddle (merchant of record, impostos automáticos) ou Stripe
- Criar planos: **Grátis** (cotações + notícias) e **Premium** (simulador, alertas, relatórios, exportação)
- Implementar checkout + webhook de assinatura; status de assinatura controla o gate dos recursos premium
- Tabela `subscriptions` no banco rastreia plano e vigência

## Ordem de Execução

1. Fase 1 (Cloud + Auth) — sem ela nada persiste
2. Fase 2 (rotas) — estrutura para receber dados e features
3. Fase 3 (APIs) — dados reais no painel
4. Fase 4 (premium funcional) — o valor pago do produto
5. Fase 5 (pagamentos) — monetização no topo do que já funciona

Cada fase é um entregável testável. Começamos pela Fase 1 assim que aprovado.
