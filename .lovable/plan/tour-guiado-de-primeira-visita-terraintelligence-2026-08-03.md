# Tour guiado de primeira visita — TerraIntelligence

## Objetivo
Adicionar um tour explicativo que aparece automaticamente na primeira visita ao painel, destacando cada seção com um "spotlight" e um balão de explicação, com setas/posicionamento ao lado do elemento. Pode ser pulado e reprisado depois pelo botão "Ajuda" que já existe na barra do topo.

## Comportamento
- **Primeira visita**: o tour abre sozinho após o carregamento.
- **Passos** (na ordem de leitura, de cima para baixo):
  1. **Barra de cotações** (MarketBar, topo) — "Aqui ficam os preços de soja, milho, boi, café, dólar e clima, atualizados."
  2. **Menu lateral** (Sidebar) — "Use o menu para trocar entre Painel Geral, Calendário, Relatórios IA e o Simulador (Premium)."
  3. **Bloco Premium** (PremiumSimulation) — "Área do plano pago: custos por hectare, break-even, margem e ROI, com simulação e exportação."
  4. **Análise IA + Notícias** (InsightAndNews) — "À esquerda, relatórios gerados por IA; à direita, as últimas notícias do agronegócio."
  5. **Comparação Histórica** (HistoricalComparison) — "Compare produtividade e rentabilidade entre safras (22/23 x 23/24)."
- Cada balão tem título, descrição curta, contador "2 de 5", botões **Pular tour**, **Voltar** e **Próximo/Concluir**.
- **Persistência**: grava `terra-tour-seen=1` no localStorage; não repete sozinho depois.
- **Replay**: o botão **Ajuda** na MarketBar reinicia o tour a qualquer momento.

## Implementação técnica
- **Marcação dos alvos**: adicionar `data-tour="<id>"` em cada seção (MarketBar, Sidebar, PremiumSimulation, InsightAndNews, HistoricalComparison).
- **Hook `useOnboardingTour`** (`src/hooks/use-onboarding-tour.ts`):
  - Estado: `step` (índice), `active` (boolean).
  - Lê/gravata o localStorage; expõe `start()`, `next()`, `prev()`, `skip()`, `dismiss()`.
  - Lista de passos com `selector` (`[data-tour="..."]`), `title`, `description`, `placement` (top/right/bottom/left).
- **Componente `<OnboardingTour />`** (`src/components/agro/OnboardingTour.tsx`):
  - Renderiza um overlay fixo fullscreen com `pointer-events-none`.
  - **Spotlight**: um retângulo posicionado sobre o elemento destacado usando `getBoundingClientRect()`, com `box-shadow` gigante (spread ~100vmax) para escurecer o resto da tela e deixar só o alvo iluminado; recalcula a posição no scroll/resize.
  - **Balão**: card posicionado ao lado do spotlight conforme `placement`, com a setinha (triângulo CSS) apontando para o elemento.
  - Trava scroll do corpo enquanto ativo (opcional, leve).
- **Montagem**: `<OnboardingTour />` no `src/routes/index.tsx` junto aos demais componentes; o hook dispara o auto-start na primeira visita via `useEffect` (após hidratação).
- **Acessibilidade**: balão com `role="dialog"`, foco gerenciado, `Esc` para pular, botões com `aria-label`.

## Arquivos
- Novo: `src/hooks/use-onboarding-tour.ts`
- Novo: `src/components/agro/OnboardingTour.tsx`
- Editado: `src/components/agro/MarketBar.tsx` (adicionar `data-tour` e ligar o botão Ajuda ao replay)
- Editado: `src/components/agro/Sidebar.tsx` (adicionar `data-tour`)
- Editado: `src/components/agro/PremiumSimulation.tsx` (adicionar `data-tour`)
- Editado: `src/components/agro/InsightAndNews.tsx` (adicionar `data-tour`)
- Editado: `src/components/agro/HistoricalComparison.tsx` (adicionar `data-tour`)
- Editado: `src/routes/index.tsx` (montar `<OnboardingTour />`)

## Estilo
Usa os tokens existentes (harvest-green, soil-brown, clay, card) — sem cores hardcoded. Balão com `bg-card`, borda `border-soil-brown/10`, título em `font-serif`, texto em `text-soil-brown/70`, botão primário em `bg-harvest-green`.

## Fora do escopo
- Dados reais / backend / login (já combinado antes) — o tour é só camada de apresentação.
