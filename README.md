# SmartFix

Plataforma de gerenciamento de reparos eletrônicos construída com Next.js App
Router, React, TypeScript, Sequelize e PostgreSQL. A aplicação usa os Route
Handlers do próprio Next.js como entrada HTTP; não existe servidor Express
paralelo e o navegador não acessa o banco diretamente.

## Tecnologias

- Next.js 16 e React 19
- TypeScript em modo `strict`
- PostgreSQL
- Sequelize ORM
- Zod para validação de entrada
- bcryptjs para hash de senha
- CSS global preservado para landing, login e cadastro; CSS Module no dashboard

## Arquitetura MVC

```text
View (app/**/*.tsx)
  -> fetch /api/...
  -> Route Handler (app/api/**/route.ts)
  -> Routes (src/routes)
  -> Controllers (src/controllers)
  -> Models (src/models)
  -> Sequelize
  -> PostgreSQL
```

Os arquivos `route.ts` apenas expõem métodos dos módulos de rotas. Validação,
autenticação, autorização, transações e respostas HTTP ficam nos controllers e
serviços.

## Estrutura relevante

```text
smartfix-app/
  app/
    api/
      auth/{login,logout,register,session}/route.ts
      clients/me/route.ts
      clients/addresses/route.ts
      clients/addresses/[addressId]/route.ts
      clients/addresses/[addressId]/primary/route.ts
      partners/me/route.ts
      health/database/route.ts
    cadastro/page.tsx
    cliente/dashboard/{page.tsx,ClientDashboard.tsx,dashboard.module.css}
    cliente/ajuda/{page.tsx,HelpCenter.tsx,help.module.css}
    cliente/enderecos/{page.tsx,AddressManager.tsx,addresses.module.css}
    parceiro/dashboard/{page.tsx,PartnerDashboard.tsx}
    login/page.tsx
    esqueci-senha/page.tsx
    privacidade/page.tsx
    termos/page.tsx
    page.tsx
  src/
    config/database.ts
    controllers/
    errors/
    middlewares/
    models/
    routes/
    services/
    types/
    validations/
  tests/
    auth.validation.test.ts
    security-services.test.ts
```

O código da aplicação fica em `smartfix-app/`. As pastas `Database/` e `docs/`
na raiz preservam os materiais de banco de dados e a documentação do projeto.

## Instalação

```bash
cd smartfix-app
npm install
```

Crie o arquivo local de ambiente.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Linux/macOS:

```bash
cp .env.example .env.local
```

Preencha as variáveis:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_LOGGING=false
DB_POOL_MAX=5
SESSION_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
```

Durante o desenvolvimento, se `.env.local` ou `DATABASE_URL` não existirem, a
SmartFix usa automaticamente um armazenamento local em `.smartfix-data/`. As
senhas continuam protegidas com bcrypt e o arquivo não é versionado. Em
produção, `DATABASE_URL` e `SESSION_SECRET` continuam obrigatórios.

Gere um segredo de sessão local com:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Para PostgreSQL local, normalmente use `DB_SSL=false`. Mantenha a validação de
certificado ativa; defina `DB_SSL_REJECT_UNAUTHORIZED=false` somente quando o
provedor exigir e o risco tiver sido avaliado.

## Execução

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm test
npm run build
npm run start
```

## Endpoints principais

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/session

GET  /api/clients/me
GET  /api/clients/addresses
POST /api/clients/addresses
PUT  /api/clients/addresses/:addressId
DELETE /api/clients/addresses/:addressId
PATCH /api/clients/addresses/:addressId/primary
GET  /api/partners/me

GET  /api/health/database
```

Respostas de sucesso usam `{ "success": true, "data": ... }`. Erros usam
`{ "success": false, "message": ... }` e podem incluir `code` e `errors`.
Erros internos e credenciais de infraestrutura não são devolvidos ao browser.

## Autenticação

1. O login procura primeiro um cliente e depois um parceiro quando o
   identificador é um e-mail; CPF e CNPJ direcionam a busca correspondente.
2. A senha é comparada no servidor com bcrypt.
3. Senhas legadas em texto puro continuam compatíveis temporariamente e são
   convertidas para bcrypt após o primeiro login válido.
4. O cookie de sessão é assinado, `HttpOnly`, `SameSite=Lax`, `Secure` em
   produção e contém apenas ID, papel e expiração.
5. `/api/auth/session` confirma que o usuário ainda existe no banco.
6. Os dashboards validam assinatura e papel no servidor antes de renderizar e
   os endpoints `/me` repetem a autorização antes de consultar dados.

## Banco de dados

O projeto recebido descreve as tabelas `clients`, `client_addresses`,
`client_devices` e `partners`. As associações configuradas são:

```text
Client hasMany ClientAddress
ClientAddress belongsTo Client

Client hasMany ClientDevice
ClientDevice belongsTo Client
```

`ClientDevice` declara somente `id` e `client_id`, pois o DDL completo da tabela
não estava disponível. Nenhum campo adicional foi inventado. O model de
`partners` mantém os nomes em inglês existentes no projeto recebido.

Não há `sequelize.sync()` nem alteração automática de schema. Nenhuma migration
foi criada porque não foi possível comparar os models com o banco real sem
`DATABASE_URL`; faça essa conferência antes de qualquer mudança de produção.

## Segurança

- Hash bcrypt com custo 12 e atualização de hashes antigos.
- Comparação constante para a compatibilidade temporária de senha legada.
- Sessão assinada e sem nome, e-mail ou senha no payload do cookie.
- Validação server-side de CPF, CNPJ, telefone, CEP, UF e confirmação de senha.
- Cadastro de cliente e endereço dentro da mesma transação.
- Seleção explícita de campos nas respostas `/me`; senhas são omitidas.
- Headers `nosniff`, `DENY`, política de referência, permissões e HSTS em produção.
- Respostas autenticadas marcadas como `no-store`.
- `.env`, `.env.local`, `node_modules`, `.next` e ZIPs locais ignorados.

## Escopo atual

Landing, cadastro, login, sessão, logout, identificação de papel, dashboards
protegidos, central de ajuda e gestão de endereços estão estruturados. O
dashboard exibe zeros e estados vazios, sem simular reparos reais. O chat da
central de ajuda ainda é uma demonstração local claramente identificada.
Dispositivos, solicitações, orçamentos, pagamentos, mensagens em tempo real,
avaliações, notificações e recuperação automática de senha continuam como
módulos futuros.
