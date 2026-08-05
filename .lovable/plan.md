# Completar o marketplace: chat, dados reais, fotos/perfis e IA

Quatro frentes, entregues em ordem. Cada fase deixa o app funcionando.

## Fase 1 — Chat e notificações

- Conversas entre comprador e produtor, iniciadas a partir de um anúncio, de um pedido de compra ou do perfil público.
- Página "Mensagens" com lista de conversas, mensagens em tempo real, envio de texto e de imagens/documentos.
- Sino de notificações no topo: nova mensagem, novo contato, novo anúncio do produto acompanhado, movimentação em pedido de compra. Contador de não lidas e marcar como lida.
- O botão "Falar com o vendedor" passa a abrir a conversa em vez de só registrar o contato.

## Fase 2 — Fotos e perfis completos

- Upload de até 5 fotos por anúncio, com capa, reordenação e remoção. Cards e busca passam a mostrar a foto real.
- Página "Meu perfil" em duas versões: produtor (fazenda, cidade/estado, culturas, foto, telefone, bio) e comprador (empresa, CPF/CNPJ, cidade/estado, produtos de interesse, quantidade média, foto, telefone).
- Foto de perfil aparece no menu, nas conversas e no perfil público do produtor.

## Fase 3 — Dados reais de mercado

- Cotações de soja, milho, boi e café, dólar, clima da cidade do usuário e notícias do agro vindos de fontes públicas, atualizados automaticamente e guardados no banco (cache) para carregar rápido.
- Barra de cotações, painel e comparação histórica passam a usar esses dados, com variação e data da última atualização.
- Se uma fonte falhar, a tela mostra o último valor conhecido em vez de quebrar.

## Fase 4 — Simulador e relatórios com IA

- Simulador de lucro salvando cenários no banco, com histórico, edição e comparação entre safras, usando preço e dólar reais.
- Relatórios gerados por IA a partir dos dados do usuário (anúncios, simulações, mercado), salvos na página Relatórios.
- Exportação em PDF e Excel dos relatórios e simulações.

## Detalhes técnicos

- Novas tabelas: `conversations`, `messages`, `notifications`, `market_quotes`, `news_items`; cada uma com GRANT + RLS restrita aos participantes/dono. Realtime em `messages` e `notifications`.
- Buckets de storage: `listing-photos` e `avatars`, com políticas por pasta do usuário.
- Cotações/notícias buscadas em server functions (`createServerFn`) e atualizadas por rota `/api/public/cron/market` protegida por segredo, gravando no cache.
- Relatórios via Lovable AI (google/gemini-3.6-flash) em server function; exportação PDF/Excel no cliente.
- Componentes seguem o design atual (tokens em `src/styles.css`, AppShell/Sidebar), responsivos e em pt-BR.