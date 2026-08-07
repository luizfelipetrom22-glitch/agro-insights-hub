# Fase 2 — Fotos nos anúncios e perfis completos

## O que muda para o usuário

### Fotos nos anúncios
- No formulário de anúncio, enviar até 5 fotos (JPG/PNG/WebP, até 5 MB cada).
- Miniaturas com remoção, reordenação e definição da capa (a primeira foto é a capa).
- Os cards do marketplace, a busca e o perfil público do produtor passam a mostrar a foto real; sem foto, o card mantém o visual atual com o ícone do produto.
- Ao excluir um anúncio, as fotos correspondentes saem do armazenamento.

### Página "Meu perfil"
Nova página no menu, com formulário diferente conforme o tipo de conta:
- **Produtor**: foto, nome, nome da fazenda, cidade, estado, culturas, telefone, bio.
- **Comprador**: foto, nome, empresa, CPF/CNPJ, cidade, estado, produtos de interesse, quantidade média, telefone.
- Salvar mostra confirmação; campos obrigatórios validados no envio.

### Foto de perfil no app
- Avatar aparece no topo (barra de mercado), na lista e no cabeçalho das conversas, e no perfil público do produtor.
- Sem foto, mostra as iniciais do nome sobre o fundo verde.

## Detalhes técnicos

- Migração: adicionar `avatar_url`, `phone` e `bio` em `profiles` (o `buyer_profiles` já tem avatar e telefone).
- Buckets privados já existentes (`listing-photos`, `avatars`); políticas em `storage.objects` por pasta `"<user_id>/..."` para escrita/remoção e leitura autenticada, reutilizando `createSignedUrl`/`useSignedUrls` de `src/lib/storage.ts`.
- Novo componente `src/components/agro/PhotoUploader.tsx` (upload múltiplo, ordenação e remoção) usado em `anuncios.tsx`; grava os caminhos no array `listings.photos`.
- Novo componente `src/components/agro/Avatar.tsx` (foto assinada + fallback de iniciais) usado em `MarketBar`, `mensagens.tsx` e `produtor.$id.tsx`.
- Nova rota `src/routes/_authenticated/perfil.tsx` com os dois formulários, gravando em `profiles` ou `buyer_profiles`; item "Meu perfil" adicionado aos dois menus da `Sidebar`.
- `ListingCard`, `buscar.tsx` e `produtor.$id.tsx` passam a resolver as URLs assinadas em lote para não gerar uma requisição por card.
- Tudo em pt-BR, com os tokens de design atuais e responsivo.
