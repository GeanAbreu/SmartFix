# SmartFix

Plataforma de gerenciamento de reparos eletrônicos com Next.js App Router,
React, TypeScript, Sequelize e PostgreSQL. A aplicação fica em `smartfix-app/`.

## Funcionalidades

- Cadastro, login, sessão assinada, logout e dashboards por papel.
- Perfil do cliente e gestão de endereços, com endereço principal protegido.
- Dispositivos com foto, apelido, série/IMEI, busca e filtro de categoria.
- Solicitação de reparo com triagem, sintomas e checklist de acessórios.
- Catálogo de serviços da assistência, orçamento por item, aprovação pelo
  cliente, acompanhamento de etapas, histórico e avaliação após conclusão.
- Aprovação administrativa de parceiros e notificações internas persistidas.
- Recuperação de senha por e-mail e login Google após vínculo explícito,
  habilitados quando os serviços externos estão configurados.
- Central de ajuda; o chat da central continua uma demonstração identificada.

## Arquitetura

```text
View (app/**/*.tsx)
  -> fetch /api/...
  -> Route Handler (app/api/**/route.ts)
  -> Routes (src/routes)
  -> Controllers (src/controllers)
  -> Models / Services
  -> Sequelize -> PostgreSQL
```

O navegador não acessa o banco diretamente. Não existe um servidor Express
paralelo nem aplicações Vite concorrentes. O frontend usa CSS global e CSS
Modules. Controllers fazem validação e autorização no servidor.

Clientes, parceiros, endereços e aparelhos mantêm os models existentes. Ordens
com triagem, orçamento, histórico e avaliação são agregados JSONB na tabela
`public.workflow_records`, que também guarda serviços, notificações e registros
de autenticação auxiliares. As operações de escrita são serializadas em
transação. Os totais dos orçamentos são derivados de valores inteiros em centavos.

## Instalação e execução

Use Node.js compatível com Next.js 16 (validado com Node 24).

```powershell
cd smartfix-app
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`. Preencha `DATABASE_URL` e `SESSION_SECRET` em
`.env.local`; esse arquivo não é versionado. Para PostgreSQL local, normalmente
use `DB_SSL=false`. Não desabilite a verificação de certificado em um banco
remoto sem avaliar a configuração do provedor.

Em development, sem `DATABASE_URL`, a aplicação usa `.smartfix-data/auth.json`
com hashes bcrypt e gravação serializada. Remova a URL de exemplo para usar
esse modo. `SMARTFIX_LOCAL_DATA_DIR` permite escolher uma pasta isolada de
ambiente. Em produção são obrigatórios banco e segredo de sessão.

Gere um segredo de sessão:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Atualização de uma instalação existente

Antes de executar esta versão com PostgreSQL, aplique
[`Database/migrations/20260909_contributions.sql`](Database/migrations/20260909_contributions.sql)
com a conta de migration no banco correto. O script adiciona dois campos aos
aparelhos e a tabela de workflow, sem recriar os usuários ou aplicar
`sequelize.sync()`.

A conta de servidor precisa de acesso à nova tabela; usuários de navegador
Supabase não recebem acesso. A aplicação não executa migrations automaticamente.
Os SQLs legados em `Database/tables/` são materiais históricos e não um instalador
completo: compare-os com os models antes de provisionar um banco vazio.

## Configurações opcionais

| Variável | Uso |
| --- | --- |
| `APP_URL` | Origem pública da aplicação; HTTPS em produção. |
| `ADMIN_USER_IDS` | IDs de contas previamente cadastradas, separados por vírgula. Vazio bloqueia o painel administrativo. |
| `RESEND_API_KEY`, `MAIL_FROM` | Recuperação de senha e e-mail de credenciamento. O remetente precisa ser validado no provedor. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login Google, com callback `${APP_URL}/api/auth/google/callback`. |

Administradores acessam `/admin/parceiros` com sua sessão normal. O usuário
vincula o Google pelo perfil ou dashboard de parceiro antes do primeiro login
social. A recuperação de senha usa um link de uso único com validade de 15
minutos e invalida as sessões anteriores. Sem provedor de e-mail configurado,
a recuperação informa indisponibilidade; as notificações internas funcionam.

## Rotas principais

| Área | Rotas |
| --- | --- |
| Conta | `/cadastro`, `/login`, `/esqueci-senha`, `/redefinir-senha` |
| Cliente | `/cliente/dashboard`, `/cliente/perfil`, `/cliente/enderecos`, `/cliente/dispositivos`, `/cliente/ordens`, `/cliente/notificacoes`, `/cliente/ajuda` |
| Parceiro | `/parceiro/dashboard`, `/parceiro/ordens`, `/parceiro/servicos`, `/parceiro/notificacoes` |
| Administração | `/admin/parceiros` |

APIs novas: `/api/orders`, `/api/orders/:id`, `/api/services`, `/api/partners`,
`/api/partners/:id/approval`, `/api/notifications`, `/api/notifications/:id`,
`PATCH /api/clients/me` e endpoints de recuperação/Google em `/api/auth`.
As APIs anteriores de autenticação, endereços e dispositivos continuam válidas.
Respostas JSON usam `{ success: true, data }` ou `{ success: false, message }`.

## Validação

```powershell
npm run lint
npm test
npx tsc --noEmit
npm run build
npm audit
```

Os testes incluem persistência em pasta temporária, isolamento entre clientes,
permissões administrativas, transições de ordens, orçamento, avaliações,
notificações, recuperação de senha e revogação de sessões. Não usam o banco ou
os provedores de produção.

A integração mantém o histórico das contribuições de todas as branches. Veja
[`docs/integracao-branches.md`](docs/integracao-branches.md) para o mapeamento dos
protótipos, decisões de adaptação e configuração por ambiente.

Pagamentos, logística real e chat em tempo real continuam fora do escopo
implementado. O acompanhamento de ordens atualiza por consulta a cada 30 segundos.
