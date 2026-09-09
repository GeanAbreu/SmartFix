# SmartFix

O **SmartFix** é uma plataforma web criada para organizar e facilitar o processo de manutenção de dispositivos eletrônicos, conectando **clientes, assistências técnicas e administradores** em um único sistema.

O projeto foi planejado para centralizar todo o fluxo de um reparo, desde o cadastro do aparelho até a conclusão do serviço, tornando o processo mais organizado, transparente e fácil de acompanhar.

## Sobre o projeto

A ideia do SmartFix surgiu da necessidade de melhorar a comunicação entre clientes e assistências técnicas durante o processo de manutenção de aparelhos eletrônicos.

Em muitos casos, informações sobre orçamento, andamento do reparo, diagnóstico e conclusão do serviço ficam espalhadas entre mensagens, ligações ou controles manuais.

O SmartFix foi planejado para concentrar essas informações em uma única plataforma.

O sistema trabalha com três tipos principais de usuários:

* **Cliente:** cadastra seus dispositivos, solicita reparos, acompanha ordens e aprova orçamentos.
* **Parceiro:** representa a assistência técnica responsável pelo atendimento e execução dos serviços.
* **Administrador:** controla e aprova os parceiros cadastrados na plataforma.

## Fluxo principal

O fluxo de uma solicitação de reparo foi planejado da seguinte forma:

```text
Cliente cadastra o dispositivo
        ↓
Solicita um reparo
        ↓
Assistência realiza a triagem
        ↓
Diagnóstico do aparelho
        ↓
Criação do orçamento
        ↓
Cliente aprova ou rejeita
        ↓
Reparo é realizado
        ↓
Cliente acompanha as etapas
        ↓
Serviço é concluído
        ↓
Cliente pode avaliar o atendimento
```

Dessa forma, tanto o cliente quanto a assistência conseguem acompanhar todas as etapas do serviço dentro da própria plataforma.

## Tecnologias utilizadas

O SmartFix está sendo desenvolvido com:

* Next.js
* React
* TypeScript
* Node.js
* Sequelize
* PostgreSQL
* CSS Modules

A aplicação principal está localizada em:

```text
smartfix-app/
```

## Arquitetura

O projeto utiliza o **App Router do Next.js** e foi estruturado em camadas para manter uma separação clara entre interface, regras de negócio e persistência de dados.

```text
View
  ↓
API Route
  ↓
Routes
  ↓
Controllers
  ↓
Models / Services
  ↓
Sequelize
  ↓
PostgreSQL
```

O navegador não acessa o banco de dados diretamente.

As validações, regras de negócio e permissões são processadas no servidor.

O projeto também foi planejado para funcionar como uma única aplicação, sem a necessidade de manter um servidor Express separado ou diferentes aplicações frontend concorrentes.

## Funcionalidades atuais

Atualmente, o SmartFix conta com funcionalidades como:

* Cadastro de usuários.
* Login e logout.
* Sessões autenticadas.
* Recuperação de senha.
* Login com Google após vínculo da conta.
* Perfil do cliente.
* Cadastro e gerenciamento de endereços.
* Cadastro de dispositivos.
* Foto do dispositivo.
* Apelido, número de série e IMEI.
* Busca e filtro de dispositivos.
* Solicitação de reparos.
* Triagem de aparelhos.
* Registro de sintomas.
* Checklist de acessórios.
* Catálogo de serviços.
* Criação de orçamento por item.
* Aprovação ou rejeição de orçamento pelo cliente.
* Acompanhamento das etapas do reparo.
* Histórico das ordens.
* Notificações internas.
* Avaliação após conclusão do serviço.
* Aprovação administrativa de parceiros.
* Dashboards separados por tipo de usuário.

## Banco de dados

O projeto utiliza **PostgreSQL com Sequelize**.

Entidades como clientes, parceiros, endereços e dispositivos possuem seus próprios models.

Parte do fluxo operacional do sistema também utiliza registros armazenados em estruturas JSONB no PostgreSQL, incluindo informações relacionadas a:

* ordens;
* triagens;
* orçamentos;
* histórico;
* avaliações;
* serviços;
* notificações.

Os valores dos orçamentos são tratados internamente em **centavos**, evitando problemas de arredondamento com valores monetários.

## Estrutura do projeto

A estrutura principal segue aproximadamente o formato:

```text
smartfix-app/
│
├── app/
│   ├── api/
│   ├── cliente/
│   ├── parceiro/
│   ├── admin/
│   ├── cadastro/
│   ├── login/
│   └── ...
│
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── ...
│
├── Database/
│   ├── migrations/
│   └── tables/
│
├── docs/
├── public/
├── package.json
└── .env.example
```

## Rotas principais

### Conta

```text
/cadastro
/login
/esqueci-senha
/redefinir-senha
```

### Cliente

```text
/cliente/dashboard
/cliente/perfil
/cliente/enderecos
/cliente/dispositivos
/cliente/ordens
/cliente/notificacoes
/cliente/ajuda
```

### Parceiro

```text
/parceiro/dashboard
/parceiro/ordens
/parceiro/servicos
/parceiro/notificacoes
```

### Administração

```text
/admin/parceiros
```

## Principais APIs

Entre as APIs utilizadas no projeto estão:

```text
/api/orders
/api/orders/:id

/api/services

/api/partners
/api/partners/:id/approval

/api/notifications
/api/notifications/:id

/api/clients/me
```

Também existem endpoints relacionados a autenticação em:

```text
/api/auth
```

As respostas seguem o padrão:

```json
{
  "success": true,
  "data": {}
}
```

ou, em caso de erro:

```json
{
  "success": false,
  "message": "Descrição do erro"
}
```

## Executando o projeto

É necessário utilizar uma versão do Node.js compatível com **Next.js 16**.

O projeto foi validado com Node.js 24.

### 1. Entre na pasta da aplicação

```powershell
cd smartfix-app
```

### 2. Instale as dependências

```powershell
npm ci
```

### 3. Crie o arquivo de ambiente

```powershell
Copy-Item .env.example .env.local
```

### 4. Configure as variáveis principais

```env
DATABASE_URL=
SESSION_SECRET=
```

### 5. Execute o projeto

```powershell
npm run dev
```

Depois acesse:

```text
http://localhost:3000
```

## Variáveis opcionais

O projeto também possui suporte para algumas configurações adicionais:

```env
APP_URL=
ADMIN_USER_IDS=
RESEND_API_KEY=
MAIL_FROM=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SMARTFIX_LOCAL_DATA_DIR=
```

Essas variáveis permitem configurar recursos como:

* URL pública da aplicação;
* usuários administradores;
* recuperação de senha por e-mail;
* login com Google;
* diretório de dados locais em desenvolvimento.

## Desenvolvimento local sem banco

Durante o desenvolvimento, caso `DATABASE_URL` não esteja configurada, a aplicação pode utilizar armazenamento local em:

```text
.smartfix-data/auth.json
```

Esse modo utiliza hashes bcrypt e gravação serializada.

Em produção, banco de dados e segredo de sessão são obrigatórios.

## Atualização do banco

Para instalações existentes que utilizam PostgreSQL, pode ser necessário aplicar a migration:

```text
Database/migrations/20260909_contributions.sql
```

A aplicação não executa migrations automaticamente.

Os arquivos existentes em:

```text
Database/tables/
```

são materiais históricos do projeto e não devem ser considerados um instalador completo do banco.

## Validação

Antes de integrar novas alterações ao projeto, podem ser executados:

```powershell
npm run lint
npm test
npx tsc --noEmit
npm run build
npm audit
```

Os testes verificam principalmente:

* autenticação;
* persistência;
* isolamento entre clientes;
* permissões administrativas;
* transições de ordens;
* orçamento;
* avaliações;
* notificações;
* recuperação de senha;
* revogação de sessões.

## Como o projeto está sendo desenvolvido

O SmartFix ainda está em desenvolvimento e vem sendo construído de forma incremental.

Durante o desenvolvimento, diferentes protótipos, telas e funcionalidades foram sendo integrados e adaptados para manter uma única estrutura de projeto.

A proposta é evitar soluções duplicadas e manter uma arquitetura centralizada, utilizando o próprio Next.js tanto para a interface quanto para as APIs da aplicação.

O desenvolvimento está sendo organizado para permitir a expansão futura da plataforma sem comprometer as funcionalidades já existentes.

Mais informações sobre a integração das diferentes partes do projeto estão disponíveis em:

```text
docs/integracao-branches.md
```

## Funcionalidades futuras

Algumas funcionalidades ainda não fazem parte do escopo atual, mas podem ser adicionadas futuramente:

* Pagamentos online.
* Chat em tempo real.
* Retirada e entrega de dispositivos.
* Integração com serviços de logística.
* Atualizações em tempo real por WebSocket.
* Relatórios administrativos.
* Métricas de desempenho das assistências.
* Sistema de reputação de parceiros.
* Aplicativo mobile.

## Objetivo do SmartFix

O objetivo do SmartFix é tornar o processo de assistência técnica mais organizado, transparente e simples para todos os envolvidos.

Para o cliente, a plataforma permite acompanhar o que está acontecendo com seu aparelho.

Para a assistência técnica, o sistema centraliza informações sobre clientes, dispositivos, ordens, diagnósticos, serviços e orçamentos.

A ideia é transformar um processo normalmente descentralizado em um fluxo digital único:

```text
Cliente
   ↓
SmartFix
   ↓
Assistência Técnica
   ↓
Triagem → Orçamento → Reparo → Conclusão
   ↓
Acompanhamento pelo cliente
```

## Status

**Projeto em desenvolvimento.**

As principais funcionalidades relacionadas a autenticação, clientes, parceiros, dispositivos, ordens de reparo, orçamento, acompanhamento, notificações e administração já fazem parte da estrutura atual do SmartFix.
