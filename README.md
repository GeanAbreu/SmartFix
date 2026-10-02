# SmartFix

O SmartFix é uma plataforma web para organizar o relacionamento entre clientes e
assistências técnicas durante todo o ciclo de reparo de dispositivos eletrônicos.
O projeto centraliza informações que normalmente ficam espalhadas entre mensagens,
ligações e anotações: cadastro do aparelho, descrição do defeito, escolha da
assistência, diagnóstico, orçamento, andamento do serviço e avaliação final.

## Objetivo do projeto

O objetivo é tornar o processo de manutenção mais transparente para o cliente e
mais organizado para a assistência técnica. A plataforma permite que cada parte
acompanhe somente os dados e as ações correspondentes ao seu papel, mantendo o
histórico da ordem de serviço em um único lugar.

O escopo atual cobre descoberta de assistências, triagem, orçamento, acompanhamento,
notificações, atendimento por mensagens e avaliação. Pagamento pela plataforma e
logística de coleta e entrega fazem parte da evolução planejada, mas não integram o
fluxo produtivo atual. Consulte o [escopo completo](docs/Escopo_Projeto.md).

## Como o sistema funciona

### Cliente

1. Cria uma conta e cadastra seus endereços e dispositivos.
2. Localiza assistências aprovadas, inclusive por proximidade.
3. Seleciona um aparelho e abre uma solicitação descrevendo o problema.
4. Preenche a triagem inicial com sintomas, estado e acessórios do aparelho.
5. Acompanha o diagnóstico, recebe o orçamento e decide se deseja aprová-lo.
6. Consulta o histórico do reparo, recebe notificações e conversa com o suporte.
7. Após a conclusão, avalia a assistência responsável.

### Assistência técnica

1. Cadastra a empresa e aguarda a aprovação administrativa.
2. Publica e administra seu catálogo de serviços.
3. Recebe solicitações vinculadas aos clientes e dispositivos atendidos.
4. Registra diagnóstico e itens do orçamento.
5. Atualiza a ordem pelas etapas de aprovação, reparo, espera de peças, retirada e
   conclusão.
6. Consulta notificações e mantém contato com o cliente.

### Administração

A área administrativa controla o credenciamento das assistências e participa dos
atendimentos direcionados à SmartFix. O acesso administrativo é concedido apenas aos
IDs configurados em `ADMIN_USER_IDS`.

## Funcionalidades principais

- autenticação própria com senha protegida por bcrypt;
- login opcional com Google OAuth;
- recuperação e redefinição de senha;
- perfis separados para cliente, parceiro e administrador;
- cadastro de endereços e definição do endereço principal;
- garagem digital para cadastro de dispositivos;
- busca geográfica de assistências aprovadas;
- catálogo de serviços e preços das assistências;
- solicitação, triagem e acompanhamento de reparos;
- orçamento detalhado e fluxo controlado de status;
- notificações e conversas de suporte;
- avaliações vinculadas a ordens concluídas;
- persistência PostgreSQL com migrations, transações, integridade referencial e RLS.

## Tecnologias utilizadas

| Área | Tecnologia |
| --- | --- |
| Aplicação web | Next.js 16, React 19 e TypeScript |
| Banco de dados | PostgreSQL / Supabase Postgres |
| ORM e acesso a dados | Sequelize, `pg` e `pg-hstore` |
| Validação | Zod |
| Autenticação | Sessões assinadas, bcrypt e Google OAuth opcional |
| Mapas e localização | Leaflet, OpenStreetMap e Photon |
| E-mail | Resend opcional |
| Qualidade | ESLint, TypeScript e Node Test Runner |

O navegador nunca acessa diretamente as tabelas. As APIs do Next.js validam a
sessão e executam as operações usando a conexão PostgreSQL do servidor. As tabelas
possuem Row Level Security habilitado e os papéis públicos do Supabase não recebem
acesso direto aos dados.

## Estrutura do repositório

```text
SmartFix/
├── Database/          # DER, tabelas base e migrations PostgreSQL
├── docs/              # escopo e documentação complementar
├── smartfix-app/      # aplicação Next.js, APIs, modelos e testes
└── README.md
```

O modelo relacional completo está documentado em
[Database/DER.md](Database/DER.md).

## Como executar

### Pré-requisitos

- Node.js 24;
- npm;
- PostgreSQL 14 ou superior, local ou fornecido pelo Supabase;
- Git, caso o projeto ainda precise ser clonado.

### 1. Obtenha o projeto e entre na aplicação

```powershell
git clone https://github.com/GeanAbreu/SmartFix.git
cd SmartFix/smartfix-app
```

Se o repositório já estiver disponível localmente, entre diretamente em
`smartfix-app`.

### 2. Instale as dependências

```powershell
npm ci
```

### 3. Configure as variáveis de ambiente

No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

No Linux ou macOS:

```bash
cp .env.example .env.local
```

Edite `.env.local` e configure, no mínimo:

```dotenv
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/postgres
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
SESSION_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
APP_URL=http://localhost:3000
```

Para PostgreSQL local, normalmente `DB_SSL=false` é suficiente. Em produção,
utilize HTTPS em `APP_URL`, uma `SESSION_SECRET` exclusiva e o certificado CA do
provedor quando necessário. Todas as opções disponíveis estão explicadas em
[`smartfix-app/.env.example`](smartfix-app/.env.example).

### 4. Prepare o banco de dados

Em um banco novo, execute primeiro os arquivos base de `Database/tables/` nesta
ordem:

1. `clients.sql`;
2. `partners.sql`;
3. `client_addresses.sql`;
4. `client_devices.sql`.

Depois, aplique as migrations e valide o schema:

```powershell
npm run db:migrate
npm run db:check
```

Em um banco que já possui o schema atual, os mesmos comandos são seguros: o migrador
aplica apenas migrations ainda não registradas e informa quando não existem
pendências.

### 5. Inicie o ambiente de desenvolvimento

```powershell
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Execução local sem PostgreSQL

Para uma demonstração isolada em desenvolvimento, configure:

```dotenv
SMARTFIX_LOCAL_AUTH=true
```

Esse modo usa armazenamento local e não substitui a validação do fluxo real com
PostgreSQL antes de uma publicação.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | inicia o servidor de desenvolvimento |
| `npm run build` | gera e valida o build de produção |
| `npm start` | executa o build de produção |
| `npm test` | executa a suíte automatizada |
| `npm run lint` | verifica a qualidade estática do código |
| `npm run db:migrate` | cria o controle e aplica migrations pendentes |
| `npm run db:check` | confere modelos, tabelas, RLS e acesso do servidor |
| `npm run db:smoke` | executa verificações de integridade no banco configurado |
| `npm run db:import-local` | importa dados do armazenamento local para PostgreSQL |

## Validação antes de publicar

```powershell
npm run db:check
npm test
npm run lint
npm run build
```

Nunca versione `.env.local`, credenciais, chaves de API ou backups locais do banco.
