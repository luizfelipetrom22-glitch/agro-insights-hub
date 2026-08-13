# O que ainda pode melhorar

Marketplace, chat, fotos, perfis e dados de mercado já estão reais e funcionando. O que continua fixo no código ou incompleto:

- **Simulador de lucro**: calcula na tela, mas não salva nada nem usa preço/dólar reais.
- **Relatórios**: lista fixa, nenhum relatório é gerado de verdade.
- **Exportação PDF/Excel**: não existe.
- **Calendário agrícola**: tabela fixa de culturas, igual para todo mundo.
- **Alertas por WhatsApp**: prometidos no premium, não implementados.
- **Assinatura paga**: nada bloqueia o premium hoje.

## O que proponho fazer agora

### 1. Simulador que salva e usa dados reais
- Preço da saca e dólar já preenchidos com a cotação do momento (editável).
- Salvar cenários na conta, com nome e data; histórico, edição e exclusão.
- Comparar dois cenários lado a lado (custo, receita, margem, ponto de equilíbrio).

### 2. Relatórios gerados por IA
- Botão "Gerar relatório" que escreve uma análise real com IA usando: cotações atuais, dólar, estado/cultura do perfil, seus anúncios e suas simulações.
- Relatórios salvos na conta, com histórico e leitura completa.

### 3. Exportação
- Baixar relatórios e simulações em PDF e em Excel.

### 4. Calendário por região
- Janelas de plantio/colheita filtradas pelo estado do usuário, com destaque do mês atual e ligação com o simulador ("simular esta safra").

Alertas por WhatsApp e cobrança de assinatura ficam para uma etapa seguinte — os dois dependem de serviços externos com custo (envio de mensagens e provedor de pagamento) e vale decidir depois que o premium tiver conteúdo.

## Detalhes técnicos

- Persistência nas tabelas existentes `simulations` e `reports`, com RLS por `auth.uid()`; GRANTs conferidos e colunas de conteúdo adicionadas por migração onde faltarem.
- Geração de texto via Lovable AI em `createServerFn` (sem chave extra), reaproveitando `fetchTickers` de `market.server.ts` como contexto.
- Exportação no cliente com bibliotecas leves compatíveis com o runtime atual (PDF e planilha), sem dependência nativa.
- Calendário passa a ler uma tabela de janelas por cultura/região em vez do array fixo.
- Mesma paleta, tipografia e AppShell; nenhuma tela muda de lugar.
