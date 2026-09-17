# Fase 3 — Simulador de Lucro conectado à safra

## Situação atual

O Simulador de Lucro já calcula tudo (margem, preço que vale a pena, sensibilidade, peso dos custos), mas:

- Começa sempre com números de exemplo, não com os seus dados.
- Nada fica salvo — ao sair da tela, tudo se perde.
- Não dá para comparar dois cenários lado a lado (ex.: "vender a R$ 120" vs "vender a R$ 135").
- Os botões do Radar de Lucro ("Simular venda", "Simular preço-alvo") levam ao simulador, mas não preenchem nada.

## O que será alterado

1. **Preenchimento automático pela safra cadastrada**
   - Área, produtividade, margem desejada e os cinco custos vêm prontos de "Minha Produção".
   - Tudo continua editável — mexer no simulador **não** altera o cadastro da safra.
   - Se a safra estiver incompleta, um aviso claro indica o que falta e oferece atalho para completar.

2. **Cotação atual como ponto de partida**
   - Botão "Usar cotação de referência" preenche o preço de venda com a cotação da cultura (quando houver).
   - Sempre com o rótulo honesto: "referência de bolsa convertida, não é preço local".

3. **Cenários salvos**
   - Botão "Salvar cenário" com nome e data (ex.: "Vender em março").
   - Lista de cenários salvos para reabrir, renomear ou excluir.

4. **Comparação lado a lado**
   - Escolha dois cenários e veja a diferença em reais: produção, receita, custo, lucro, margem e ponto de equilíbrio de cada um, com o destaque "cenário B rende +R$ X a mais".

5. **Atalhos vindos do Radar de Lucro**
   - "Simular venda" abre o simulador já com a cotação atual no preço.
   - "Simular preço-alvo" abre com o preço necessário para sua margem.
   - "Simular impacto" abre com a variação recente do mercado aplicada.

## Por quê

O produtor precisa ver o efeito em reais antes de decidir, sem redigitar dados nem interpretar tabelas. Cenários salvos e comparação transformam o simulador de calculadora descartável em ferramenta de decisão.

## Telas afetadas

- Simulador de Lucro (principal)
- Radar de Lucro no Painel (apenas os destinos dos botões)
- Minha Produção (nenhuma mudança visual; só leitura dos dados)

## Funcionalidades novas

- Carregar dados da safra automaticamente.
- Salvar, reabrir, renomear e excluir cenários (guardados no banco, por usuário).
- Comparar dois cenários lado a lado com diferença financeira destacada.
- Botão de cotação de referência com identificação de fonte.

## Funcionalidades preservadas

- Todo o motor de cálculo atual (margem, preço-alvo, ponto de equilíbrio, sensibilidade de −15% a +15%, peso dos custos).
- Visual, cores e tipografia atuais.
- Marketplace, chat, segurança e todo o restante do sistema — nada muda.

## Regras mantidas

- Cálculos continuam determinísticos e auditáveis; nenhum número é inventado.
- Sem dados suficientes, o sistema pede o dado em vez de estimar.
- A cotação nunca será apresentada como preço local de venda.

## Detalhes técnicos

- Reaproveitar a tabela `simulations` já existente no banco (ampliando campos apenas se necessário), com proteção por usuário (RLS).
- Reutilizar as fórmulas centralizadas de `src/lib/profit.ts`, já compartilhadas com o Radar.
- Sem novas dependências, sem mudança de arquitetura.
