# O que já funciona e o que falta

O marketplace está funcionando de ponta a ponta: cadastro com escolha de perfil, painéis separados de produtor e comprador, anúncios com fotos, busca com filtros, favoritos, pedidos de compra, perfil público do produtor, chat em tempo real com anexos, notificações e edição de perfil.

Continuam com dados fixos no código:

- Barra do topo: soja, milho, boi, café, dólar e clima
- Notícias e o "insight de IA" da página inicial
- Comparação entre anos
- Relatórios (lista fixa, sem gerar nada)
- Simulador (calcula na tela, mas não salva nem exporta)

## O que proponho fazer agora

### 1. Dados reais de mercado
- Dólar em tempo real e clima real pela cidade/estado do usuário.
- Cotações de commodities atualizadas, com data da última atualização visível.
- Notícias do agronegócio reais, com link para a fonte.
- Se uma fonte falhar, a barra mostra o último valor conhecido em vez de quebrar.

### 2. Relatórios com IA de verdade
- Botão "Gerar relatório" que produz uma análise escrita por IA usando preços atuais, dólar e o perfil do usuário (produto, estado).
- Relatórios salvos na conta, com histórico e leitura completa.
- Exportar em PDF e Excel.

### 3. Simulador que salva
- Simulações gravadas na conta, com nome, data e comparação entre cenários.
- Exportação da simulação junto com os relatórios.

### 4. Comparação entre anos
- Passa a usar as simulações e os preços armazenados em vez da tabela fixa.

## Detalhes técnicos

- Busca de cotações/dólar/clima/notícias via `createServerFn` (chaves ficam no servidor), com cache curto em tabela `market_snapshots` para não estourar limites de API e servir de fallback.
- Geração de texto pela Lovable AI (sem chave extra), em server function; resultado salvo na tabela `reports` já existente.
- Migração: `market_snapshots` (leitura pública via política `TO anon`), colunas de conteúdo em `reports`, e uso da tabela `simulations` existente com RLS por `auth.uid()`; GRANTs para toda tabela nova.
- Exportação PDF/Excel no cliente, com bibliotecas leves compatíveis com o runtime atual.
- Mesma paleta e tipografia; nenhuma tela existente muda de lugar.

Fontes externas de clima e notícias podem exigir chave. Se for o caso, peço a chave na hora ou uso uma fonte pública gratuita quando existir.