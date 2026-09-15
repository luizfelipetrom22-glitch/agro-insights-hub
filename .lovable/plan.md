# Plano de reposicionamento — TerraIntelligence

## Diagnóstico do produto atual

A TerraIntelligence já possui uma base relevante e não precisa ser reconstruída:

- **Funciona hoje:** autenticação por e-mail/Google, perfis de produtor e comprador, marketplace, anúncios com fotos, pedidos, favoritos, chat em tempo real, notificações, sistema antigolpe, cotações, dólar, clima, notícias e histórico de preços.
- **Funciona, mas isolado:** o simulador calcula produção, receita, custo, lucro, margem, ponto de equilíbrio, sensibilidade ao preço e peso dos custos; porém os dados ficam apenas na tela e não alimentam o painel.
- **Ainda é demonstrativo:** o destaque principal do painel usa números fixos; relatórios e calendário exibem conteúdo fixo; alertas financeiros personalizados e exportações não estão ativos.
- **IA atual:** interpreta cotações gerais do mercado, mas ainda não analisa a propriedade nem explica a margem do produtor.
- **Dados disponíveis no perfil:** identificação, fazenda, localização e culturas. Ainda faltam dados produtivos persistentes por safra, como área, produtividade, custos detalhados e margem desejada.
- **Benchmark:** as cotações atuais são referências de bolsa convertidas para reais, não preços locais de balcão nem benchmarks de custo. Serão identificadas como referência de mercado, nunca como verdade local.

### Problema central

O produto hoje mostra boas informações, mas obriga o produtor a conectá-las mentalmente. O reposicionamento deve criar este fluxo:

```text
Mercado atual + contexto da propriedade
                  ↓
       margem e impacto financeiro
                  ↓
     oportunidade, risco e próxima ação
```

A primeira experiência do produtor passará a responder: **“Onde estou perdendo dinheiro e o que posso fazer para aumentar minha margem?”**

---

## FASE 1 — Melhorias de UX e posicionamento

### O que será alterado
- Reorganizar a experiência do produtor em quatro áreas claras: **Visão Geral, Minha Produção, Rentabilidade e Decisões**.
- Reescrever títulos, textos e chamadas para falar de impacto financeiro, não de quantidade de recursos.
- Reorganizar o painel para priorizar resultado, margem, ponto de equilíbrio e oportunidades; mercado, clima e notícias passam a ser contexto secundário.
- Transformar o cadastro produtivo em uma etapa simples por safra: cultura, área, produtividade esperada, custos e margem desejada.
- Substituir números demonstrativos do destaque atual por estado vazio honesto: “Complete sua safra para calcular sua margem”.
- Atualizar o tour para ensinar o fluxo “cadastre a safra → veja a margem → simule → decida”.

### Por quê
Sem contexto produtivo salvo, qualquer insight financeiro seria genérico ou inventado. Esta fase cria clareza e a base mínima para personalização.

### Telas afetadas
- Painel Geral
- Meu Perfil / nova área “Minha Produção”
- Menu lateral e tour inicial
- Página pública inicial e entrada, apenas nos textos de posicionamento

### Funcionalidades novas
- Cadastro e edição da safra ativa.
- Indicador de completude dos dados necessários para análises.
- Estados vazios que explicam exatamente qual informação falta, sem números fictícios.

### Funcionalidades preservadas
- Visual “Modern Agronomist”, paleta, tipografia e estrutura geral.
- Fluxo do comprador e marketplace.
- Autenticação, perfis, cotações, clima, notícias, histórico, chat, notificações e segurança.

---

## FASE 2 — Radar de Lucro

### O que será alterado
- Colocar o **Radar de Lucro** como primeiro bloco do painel do produtor.
- Cruzar a safra ativa com a cotação disponível e mostrar: margem estimada por saca, resultado estimado, ponto de equilíbrio e distância até a margem desejada.
- Identificar oportunidades e riscos calculáveis, por exemplo: maior grupo de custo, preço acima/abaixo do ponto de equilíbrio e impacto de uma variação recente de preço.
- Cada oportunidade terá uma ação direta: **Simular venda**, **Ver custos** ou **Atualizar safra**.
- Exibir fonte, horário e natureza da referência usada: “cotação de bolsa convertida”, nunca “preço local”.

### Por quê
O painel deixa de ser um mural de informações e passa a ser uma leitura financeira personalizada e acionável.

### Telas afetadas
- Painel Geral
- Minha Produção
- Simulador, como destino das ações

### Funcionalidades novas
- Motor determinístico de oportunidades e riscos.
- Resumo financeiro da safra ativa.
- Explicação do cálculo e nível de confiança dos dados.
- Prioridade por impacto financeiro estimado, sem multiplicar cards ou gráficos.

### Funcionalidades preservadas
- Barra de mercado, clima, notícias e histórico, reposicionados abaixo do Radar.
- Análise geral de mercado já existente.
- Todos os cálculos permanecem auditáveis; nenhuma conclusão depende apenas de IA.

---

## FASE 3 — Simuladores

### O que será alterado
- Evoluir o simulador atual sem substituir seu motor de cálculo.
- Preencher automaticamente área, produtividade e custos a partir da safra ativa, mantendo tudo editável.
- Permitir escolher a cotação atual como ponto de partida, sempre identificando sua fonte e limitação regional.
- Salvar cenários com nome e data.
- Comparar cenário base e cenário alternativo lado a lado, destacando a diferença financeira total.
- Adicionar modos simples para simular preço de venda, produtividade e redução/aumento de custos.

### Por quê
O produtor precisa enxergar imediatamente o efeito em reais antes de tomar uma decisão, sem refazer cadastros ou interpretar tabelas complexas.

### Telas afetadas
- Simulador de Lucro
- Painel Geral / Radar de Lucro
- Minha Produção

### Funcionalidades novas
- Histórico, edição e exclusão de cenários.
- Comparação de dois cenários.
- Resumo: produção, receita, custo total, resultado, margem, ponto de equilíbrio e diferença entre cenários.
- Atalhos vindos do Radar, já abrindo a variável relevante.

### Funcionalidades preservadas
- Sensibilidade de preço de -15% a +15%.
- Detalhamento de custos e indicação do maior peso.
- Cálculos atuais de margem, preço-alvo e ponto de equilíbrio.

---

## FASE 4 — Inteligência / IA

### O que será alterado
- Reposicionar a IA como **Analista da Propriedade**, não como chat genérico.
- Gerar respostas usando somente dados autorizados da safra, cenários salvos e mercado atual.
- Oferecer perguntas orientadas à decisão: “Por que minha margem caiu?”, “Qual meu maior custo?”, “E se o preço cair 5%?” e “Qual preço preciso para margem de 20%?”.
- Separar claramente: **fatos cadastrados**, **cálculos do sistema**, **referências externas** e **interpretação da IA**.
- Transformar Relatórios IA em análises reais, salvas e relacionadas à safra do usuário.

### Por quê
A IA deve explicar e priorizar, enquanto os números continuam vindo de cálculos verificáveis. Isso reduz o risco de recomendações inventadas.

### Telas afetadas
- Painel Geral
- Relatórios IA
- Simulador
- Minha Produção

### Funcionalidades novas
- Analista contextual com perguntas sugeridas.
- Relatórios gerados e salvos.
- Resposta explícita “não há dados suficientes” quando faltar contexto.
- Registro das fontes e dos dados usados em cada análise.

### Funcionalidades preservadas
- Insight geral de mercado, agora identificado como análise geral.
- Histórico de preços, notícias e cotações como contexto.
- Nenhuma IA terá permissão para criar ou substituir valores financeiros cadastrados.

---

## FASE 5 — Alertas

### O que será alterado
- Evoluir os avisos atuais para alertas de margem personalizados.
- Permitir regras como: preço atingiu ponto de equilíbrio, margem atingiu meta, preço caiu X% ou custo alterado reduziu o resultado.
- Mostrar sempre o evento, o impacto estimado na propriedade e uma ação recomendada.
- Começar com alertas dentro da plataforma; WhatsApp entra somente após validação do conteúdo e escolha do serviço de envio.

### Por quê
“A soja subiu” informa; “sua margem aumentou em R$ X/sc” ajuda a decidir.

### Telas afetadas
- Sino de notificações
- Painel Geral
- Nova gestão de alertas
- Simulador

### Funcionalidades novas
- Regras personalizadas por safra e margem.
- Histórico e leitura dos alertas.
- Ações diretas para abrir o cenário correspondente.
- Preparação para WhatsApp sem prometer envio antes da integração externa.

### Funcionalidades preservadas
- Notificações em tempo real do marketplace e mensagens.
- Alertas e bloqueios do sistema antigolpe.
- Estrutura de alertas já existente no banco, ampliada sem quebrar os usos atuais.

---

## FASE 6 — Refinamento e preparação comercial

### O que será alterado
- Revisar a experiência completa em celular e computador, com foco em leitura rápida e poucos números prioritários.
- Reduzir redundâncias, excesso de cards e textos genéricos.
- Finalizar exportação de cenários e relatórios em PDF e Excel.
- Atualizar página pública, mensagens de valor e demonstração para o novo posicionamento.
- Definir com clareza o que é gratuito, premium e dependente de dados suficientes.
- Instrumentar os principais passos: safra cadastrada, Radar visualizado, cenário salvo, oportunidade aberta e alerta criado.

### Por quê
Esta fase transforma a solução funcional em um produto demonstrável, vendável e mensurável, sem inflar o escopo.

### Telas afetadas
- Todas as telas do produtor
- Página pública e entrada
- Relatórios e simulador
- Ajustes compartilhados de navegação no comprador, sem alterar sua lógica

### Funcionalidades novas
- Exportações reais em PDF e Excel.
- Métricas de adoção e funil de ativação.
- Tratamento final de carregamento, ausência de dados, falhas de fontes e acessibilidade.

### Funcionalidades preservadas
- Arquitetura, tecnologias, dependências e integrações existentes sempre que adequadas.
- Marketplace completo, chat, perfis, fotos, segurança e experiência do comprador.
- Identidade visual atual, refinada em vez de substituída.

---

## Regras de produto para todas as fases

- Nenhum benchmark será mostrado como real sem fonte confiável, localidade, unidade e data.
- Cotações de bolsa convertidas serão rotuladas como **referência de mercado**, não preço local de venda.
- Quando faltar área, produtividade, custo ou preço compatível, o sistema pedirá o dado em vez de estimá-lo silenciosamente.
- Cálculos financeiros serão determinísticos e testáveis; a IA explicará os resultados, mas não os inventará.
- O comprador continuará com sua experiência de marketplace; o reposicionamento financeiro será aplicado primeiro ao produtor.
- Cada fase será implementada e validada separadamente antes da seguinte.

## Detalhes técnicos

- Aproveitar as tabelas existentes de perfis, simulações, relatórios, alertas e notificações; ampliar apenas os campos que os novos cálculos realmente exigirem.
- Manter proteção por usuário no banco e as regras atuais de acesso.
- Centralizar fórmulas financeiras para que Painel, Radar, Simulador, Alertas e IA usem os mesmos resultados.
- Usar as integrações atuais de mercado, clima, notícias e IA, adicionando identificação de fonte, horário e fallback.
- Não adicionar provedor de pagamento, WhatsApp ou fonte de benchmark nesta etapa sem decisão específica e validação comercial.
