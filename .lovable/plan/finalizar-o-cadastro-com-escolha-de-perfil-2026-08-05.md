# Finalizar o cadastro com escolha de perfil

Falta ligar a escolha "Produtor / Comprador" ao cadastro e garantir que cada perfil caia no painel certo. Hoje `/auth` cria toda conta como produtor e `/painel` é o destino fixo após o login.

## O que muda

### 1. Escolha de perfil no cadastro
Ao clicar em "Cadastre-se", antes do nome/e-mail/senha aparecem dois cartões: 🌾 Sou Produtor e 🛒 Sou Comprador (produtor pré-selecionado). A escolha viaja junto com o cadastro, então a conta já nasce com o perfil certo — sem precisar passar pela tela de boas-vindas.

### 2. Google e contas antigas
Quem entra pelo Google (ou qualquer conta sem perfil definido) é levado uma única vez à tela "Bem-vindo" para escolher o perfil, e só depois ao painel.

### 3. Destino após entrar
Depois de entrar, comprador vai para o Painel do Comprador e produtor para o Painel Geral. Se um comprador abrir o painel do produtor (ou o contrário), é redirecionado para o painel correto em vez de ver a tela errada.

## Detalhes técnicos

- `src/routes/auth.tsx`: novo estado `userType` no modo cadastro, enviado em `signUp` como `options.data.user_type` — a trigger `handle_new_user` já lê esse campo e cria `buyer_profiles` quando for comprador. Após o login, busca-se o perfil com `fetchSessionProfile` para decidir o destino (`/comprador`, `/painel` ou `/bem-vindo` quando o perfil ainda não foi definido), respeitando o parâmetro `redirect` quando presente.
- `src/routes/_authenticated/painel.tsx`: guarda leve com `useProfile` — comprador é redirecionado a `/comprador`, espelhando o que `comprador.tsx` já faz para produtores.
- `src/routes/_authenticated/route.tsx`: usuários autenticados sem `user_type` definido (Google/contas antigas) são enviados a `/bem-vindo`, exceto quando já estão nessa rota.
- Mesma paleta e tipografia atuais; nenhuma mudança de banco de dados.