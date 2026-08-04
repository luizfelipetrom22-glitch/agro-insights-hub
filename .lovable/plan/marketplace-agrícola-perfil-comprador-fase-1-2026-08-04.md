# Marketplace agrícola: perfil Comprador (Fase 1)

Hoje a plataforma só tem inteligência de mercado (`profiles`, `simulations`, `alerts`, `reports`) — não existe nenhuma tabela de anúncios de produtos. Então a Fase 1 precisa criar tanto o lado do comprador quanto o lado de anúncios do produtor, que é o que dá sentido à busca e aos favoritos.

Escopo confirmado: perfis + cadastro com escolha, anúncios, busca com filtros, favoritos e pedidos de compra. Chat e notificações ficam para a Fase 2.

## O que será construído

### 1. Escolha de perfil no cadastro
Na tela de cadastro, antes do e-mail/senha, a pergunta "Como você deseja utilizar a plataforma?" com dois cartões: 🌾 Sou Produtor e 🛒 Sou Comprador. A escolha cria o perfil correspondente e define para onde o usuário é levado depois do login. Quem entra pelo Google escolhe o perfil em uma tela de boas-vindas na primeira vez.

### 2. Dois dashboards
- **Produtor** (`/painel`): mantém tudo que já existe (cotações, IA, comparação histórica, tour) e ganha um bloco "Meus anúncios" e "Pedidos de compra compatíveis com meus produtos".
- **Comprador** (`/comprador`): últimos anúncios, produtos recomendados (baseados nos produtos de interesse do perfil), favoritos recentes, meus pedidos de compra publicados e atalho para alertas.

O menu lateral muda automaticamente conforme o perfil logado.

### 3. Anúncios de produtos (lado produtor)
Página "Meus anúncios" com criar, editar, pausar e excluir. Campos: produto, descrição, quantidade, unidade, preço, estado, cidade, safra, certificações, agricultura familiar, orgânico e fotos. Perfil público do produtor com fazenda/empresa e seus anúncios ativos.

### 4. Busca e filtros
Página de busca com filtros por produto, estado, cidade, quantidade disponível, faixa de preço, certificações, agricultura familiar e orgânico. Ordenação por mais recentes, menor e maior preço. Distância aproximada por estado/cidade (mesma cidade → mesmo estado → demais), sem mapa.

### 5. Favoritos
O comprador salva anúncios e produtores; página "Favoritos" com as duas abas.

### 6. Pedidos de compra
Formulário com produto, quantidade, unidade, estado, cidade, preço desejado (opcional), prazo e observações. Aparecem em uma vitrine pública de demandas e no painel dos produtores cujos produtos/estado combinam.

### 7. Contato
Nesta fase o contato é um botão "Falar com o vendedor" que revela telefone/e-mail do produtor (e registra o interesse, alimentando o "histórico de negociações"). O chat completo com imagens e documentos entra na Fase 2, reaproveitando esse registro.

## Detalhes técnicos

**Banco (uma migração):**
- `user_type` enum (`produtor` | `comprador`) e coluna em `profiles`; trigger de signup lê `raw_user_meta_data`.
- `buyer_profiles`: nome, empresa, cpf_cnpj, cidade, estado, produtos de interesse (array), quantidade média comprada, foto, telefone, e-mail, status de verificação.
- `listings`: produtor, produto, descrição, quantidade, unidade, preço, estado, cidade, safra, certificações[], organico, agricultura_familiar, fotos[], status.
- `purchase_requests`: comprador, produto, quantidade, unidade, estado, cidade, preço desejado, prazo, observações, status.
- `favorites`: comprador + alvo (listing ou produtor), único por par.
- `contact_events`: comprador, anúncio, produtor, data — base do histórico.
- Todas com GRANTs explícitos, RLS e `updated_at`: leitura pública apenas de anúncios ativos e pedidos abertos; escrita e leitura de dados privados restritas ao dono; perfis de comprador visíveis só para o próprio usuário e para o produtor de um anúncio contatado.

**Frontend:** rotas novas sob `_authenticated/` (`comprador`, `anuncios`, `buscar`, `favoritos`, `pedidos`) mais o perfil público do produtor em rota pública com SEO. `Sidebar` passa a receber a navegação do perfil ativo; hook `useProfile` compartilhado. Leituras públicas via server functions com chave publicável; leituras e escritas do usuário via `requireSupabaseAuth`. Mesma paleta e tipografia atuais, componentes pequenos, responsivo, sem quebrar as páginas existentes.

## Fora do escopo desta fase
Chat com anexos, notificações, verificação de documentos, pagamentos e exportações — planejados para as próximas fases sobre a mesma estrutura.
