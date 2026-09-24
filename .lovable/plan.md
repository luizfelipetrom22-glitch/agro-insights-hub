# Fase 6 — Planos Grátis x Premium e Relatórios reais

Duas entregas. Sem cobrança online por enquanto: tudo fica pronto para ligar o pagamento depois.

## 1. Separação Grátis x Premium (sem cobrar)

**O que muda para você**
- Nova página **Planos** comparando Grátis e Premium, com botão "Quero o Premium" que registra interesse (sem pagamento).
- Cada conta tem um plano: começa em Grátis. Só um administrador pode mudar para Premium (útil para liberar testadores).
- Recursos Premium mostram um aviso elegante com o que o recurso faz e atalho para Planos, em vez de simplesmente sumir.

**Divisão proposta**
- Grátis: cotações, clima, notícias, calendário, cadastro da safra, Radar de Lucro, marketplace, chat, segurança, 1 cenário salvo no simulador, 3 perguntas por dia ao Analista.
- Premium: cenários ilimitados e comparação, Analista sem limite, alertas de margem, relatórios com PDF/Excel.

**Preservado**: marketplace, chat, segurança e experiência do comprador continuam iguais.

## 2. Relatórios reais (página Análises IA)

**O que muda para você**
- Os três relatórios fixos saem. No lugar, botão **Gerar relatório da safra**: a IA escreve um relatório usando só sua safra, seus cenários salvos e a referência de mercado do momento — nunca inventa números; se faltar dado, diz o que falta.
- Relatórios ficam salvos, com data, para ler de novo ou excluir.
- Exportar cada relatório em **PDF** e os números da safra/cenários em **Excel**.
- Sem safra cadastrada: estado vazio honesto com atalho para Minha Produção.

## Detalhes técnicos
- Migração: tabela `user_plans` (user_id, plan `free|premium`, updated_at) com GRANT + RLS (usuário lê o próprio; só `has_role(admin)` altera) e registro de interesse em `plan_interest`. Linhas criadas sob demanda (ausência = free).
- Hook `usePlan()` + componente `PremiumGate`; limites verificados também no servidor (server function do analista e dos relatórios checam o plano).
- `generateSeasonReport` (createServerFn, `requireSupabaseAuth`) reutiliza o padrão de `analyst.functions.ts` e o contexto de `profit.ts`; grava em `reports` (tabela existente).
- Exportação no navegador: `jspdf` (PDF) e `xlsx` (Excel) — duas dependências novas, pequenas, só usadas nessa página.
- Rota nova `/planos` com head próprio; Sidebar ganha item "Planos".
