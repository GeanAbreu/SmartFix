# 🔧 SmartFix

<div align="center">

### Plataforma de Gerenciamento de Reparos Eletrônicos

**Conectando clientes e assistências técnicas em uma plataforma moderna, segura e centralizada.**

<br>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge\&logo=nextdotjs\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge\&logo=supabase\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge\&logo=postgresql\&logoColor=white)

<br>

**Status:** 🚧 Em desenvolvimento

</div>

---

# 🚀 Como executar o SmartFix

Esta seção apresenta os passos necessários para baixar o projeto do GitHub e executá-lo localmente.

## 📋 Pré-requisitos

Antes de começar, certifique-se de possuir as seguintes ferramentas instaladas:

| Ferramenta            | Finalidade                       |
| --------------------- | -------------------------------- |
| **Node.js**           | Ambiente de execução JavaScript  |
| **npm**               | Gerenciamento das dependências   |
| **Git**               | Clonagem e controle de versão    |
| **Navegador moderno** | Execução da aplicação            |
| **VS Code**           | Editor recomendado, mas opcional |

Para verificar se Node.js, npm e Git estão instalados:

```bash
node --version
npm --version
git --version
```

---

## 1️⃣ Clone o repositório

Abra um terminal e execute:

```bash
git clone https://github.com/GeanAbreu/SmartFix
```

Acesse a pasta clonada:

```bash
cd SmartFix
```

---

## 2️⃣ Acesse a aplicação

O código-fonte da aplicação está localizado em:

```text
SmartFix/smartfix-app/
```

Entre nessa pasta:

```bash
cd smartfix-app
```

---

## 3️⃣ Instale as dependências

Execute:

```bash
npm install
```

O npm utilizará os arquivos `package.json` e `package-lock.json` para instalar automaticamente todas as dependências necessárias.

> A pasta `node_modules` não é armazenada no GitHub e será criada automaticamente durante esse processo.

---

## 4️⃣ Configure as variáveis de ambiente

Na raiz de:

```text
smartfix-app/
```

crie um arquivo chamado:

```text
.env.local
```

Configure nele as variáveis necessárias para conexão com o Supabase.

```env
NEXT_PUBLIC_SUPABASE_URL = 'https://jrgelocbixpgttrxzawv.supabase.co';
NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZ2Vsb2NiaXhwZ3R0cnh6YXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTA1MjIsImV4cCI6MjEwMjEyNjUyMn0.ZYAs3UZNOCH65rW83J-npxbcEbqnrr0KYj3fPCRQYKU';
```
---

## 5️⃣ Execute o projeto

Dentro de `smartfix-app`, execute:

```bash
npm run dev
```

A aplicação será iniciada em modo de desenvolvimento.

Por padrão, acesse:

```text
http://localhost:3000
```

---

## ⚡ Resumo da instalação

```bash
git clone https://github.com/GeanAbreu/SmartFix
cd SmartFix/smartfix-app
npm install
npm run dev
```

> Antes de executar a aplicação, lembre-se de configurar o arquivo `.env.local`.

---

# 📌 Sobre o SmartFix

O **SmartFix** é uma plataforma web desenvolvida para modernizar e simplificar o processo de solicitação, acompanhamento e gerenciamento de reparos em dispositivos eletrônicos.

A plataforma cria um ambiente centralizado no qual clientes podem cadastrar seus dispositivos, solicitar serviços de assistência técnica e acompanhar o andamento dos reparos.

Ao mesmo tempo, assistências técnicas parceiras podem utilizar o SmartFix para receber solicitações, administrar atendimentos e organizar os serviços realizados.

O projeto busca proporcionar maior **organização, transparência, segurança e praticidade** durante todo o processo de manutenção.

---

# 🎯 Objetivo

O principal objetivo do SmartFix é digitalizar o processo tradicional de assistência técnica e centralizar informações que normalmente ficam distribuídas entre mensagens, ligações, anotações e diferentes sistemas.

A plataforma busca conectar:

* 👤 **Clientes**
* 🛠️ **Assistências técnicas**
* 👨‍💼 **Administradores**
* 📱 **Dispositivos cadastrados**
* 📋 **Solicitações de reparo**

---

# ✨ Funcionalidades

## 👤 Área do Cliente

O cliente poderá:

* Criar e acessar sua conta;
* Gerenciar seus dados pessoais;
* Cadastrar e gerenciar endereços;
* Cadastrar dispositivos eletrônicos;
* Solicitar serviços de assistência técnica;
* Acompanhar o andamento dos reparos;
* Consultar o histórico de solicitações.

## 🛠️ Área da Assistência Técnica

As assistências parceiras poderão:

* Criar cadastro na plataforma;
* Gerenciar informações da assistência;
* Receber solicitações de clientes;
* Administrar atendimentos;
* Atualizar o status dos reparos;
* Consultar dispositivos vinculados às solicitações.

## 🛡️ Área Administrativa

O ambiente administrativo será responsável por:

* Gerenciar usuários;
* Gerenciar assistências técnicas;
* Aprovar parceiros;
* Controlar informações da plataforma;
* Acompanhar as operações do sistema.

---

# 🧰 Tecnologias

| Tecnologia     | Utilização                             |
| -------------- | -------------------------------------- |
| **Next.js**    | Framework principal da aplicação       |
| **React**      | Construção das interfaces              |
| **TypeScript** | Tipagem e desenvolvimento da aplicação |
| **Node.js**    | Ambiente de execução                   |
| **CSS**        | Estilização das interfaces             |
| **Supabase**   | Backend, autenticação e serviços       |
| **PostgreSQL** | Banco de dados relacional              |
| **Git**        | Controle de versão                     |
| **GitHub**     | Hospedagem e colaboração do código     |

---

# 📂 Estrutura do Repositório

O SmartFix foi organizado separando **banco de dados**, **documentação** e **aplicação**.

```text
SmartFix/
│
├── Database/
│   └── tables/
│
├── docs/
│   ├── diagramas/
│   ├── DER.md
│   ├── Escopo_Projeto.md
│   ├── Lei152112025.md
│   ├── Requisitos_Funcionais.md
│   └── Requisitos_Não_Funcionais.md
│
├── smartfix-app/
│   ├── app/
│   ├── lib/
│   ├── public/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   └── tsconfig.json
│
└── README.md
```

### Organização

| Diretório       | Responsabilidade                      |
| --------------- | ------------------------------------- |
| `Database/`     | Scripts e estrutura do banco de dados |
| `docs/`         | Documentação técnica e acadêmica      |
| `smartfix-app/` | Código-fonte da aplicação web         |

---

# 🗄️ Banco de Dados

O SmartFix utiliza **PostgreSQL**, integrado à aplicação por meio do **Supabase**.

Os scripts SQL utilizados para documentar e reproduzir a estrutura das tabelas estão armazenados em:

```text
Database/tables/
```

### Estrutura

```text
SmartFix/
└── Database/
    └── tables/
```

Entre as entidades utilizadas pelo sistema estão:

```text
clients
client_addresses
client_devices
partner
```

Essas entidades representam os principais dados relacionados aos clientes, endereços, dispositivos e assistências técnicas cadastradas na plataforma.

---

# 🔗 Modelagem de Dados

De forma simplificada, a organização das principais entidades segue esta estrutura:

```text
                    ┌──────────────────┐
                    │     CLIENTS      │
                    └────────┬─────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  │ 1:N             1:N │
                  ▼                     ▼
       ┌───────────────────┐   ┌──────────────────┐
       │ CLIENT_ADDRESSES  │   │  CLIENT_DEVICES  │
       └───────────────────┘   └──────────────────┘


                    ┌──────────────────┐
                    │     PARTNER      │
                    └──────────────────┘
```

A documentação detalhada da modelagem pode ser encontrada em:

```text
docs/DER.md
```

---

# 📚 Documentação

Toda a documentação técnica e acadêmica do SmartFix está centralizada em:

```text
docs/
```

## 📐 Diagramas

**Caminho:**

```text
docs/diagramas/
```

Contém os diagramas utilizados para representar visualmente a arquitetura, processos e modelagem do SmartFix.

---

## 🗃️ DER — Diagrama Entidade-Relacionamento

**Caminho:**

```text
docs/DER.md
```

Apresenta a organização das entidades do banco de dados e seus respectivos relacionamentos.

---

## 📋 Escopo do Projeto

**Caminho:**

```text
docs/Escopo_Projeto.md
```

Apresenta o escopo do SmartFix, seus objetivos, limites e principais características.

---

## ⚖️ Lei 15.211/2025

**Caminho:**

```text
docs/Lei152112025.md
```

Documento destinado às informações relacionadas à **Lei nº 15.211/2025** consideradas durante o desenvolvimento e documentação do projeto.

---

## ✅ Requisitos Funcionais

**Caminho:**

```text
docs/Requisitos_Funcionais.md
```

Contém os requisitos relacionados às funcionalidades e aos comportamentos esperados do SmartFix.

Os requisitos funcionais especificam **o que o sistema deve fazer**.

---

## ⚙️ Requisitos Não Funcionais

**Caminho:**

```text
docs/Requisitos_Não_Funcionais.md
```

Apresenta os requisitos relacionados à qualidade e ao funcionamento da plataforma, incluindo aspectos como:

* Segurança;
* Desempenho;
* Disponibilidade;
* Usabilidade;
* Manutenibilidade;
* Escalabilidade.

---

# 💻 Aplicação Web

O código-fonte principal está localizado em:

```text
smartfix-app/
```

### Caminho completo

```text
SmartFix/
└── smartfix-app/
```

Essa pasta concentra a aplicação desenvolvida utilizando:

```text
Next.js
   +
React
   +
TypeScript
   +
Supabase
```

A aplicação utiliza a estrutura de roteamento do **Next.js App Router**.

---

# 🏗️ Arquitetura

A aplicação busca manter responsabilidades separadas para facilitar manutenção e evolução do sistema.

```text
Interface
   │
   ▼
Next.js / React
   │
   ▼
Regras da aplicação
   │
   ▼
Supabase
   │
   ▼
PostgreSQL
```

A arquitetura poderá evoluir conforme novas funcionalidades e padrões forem incorporados ao projeto.

---

# 🔐 Segurança

O SmartFix busca seguir boas práticas de segurança durante o desenvolvimento.

Entre elas:

* Utilização de autenticação segura;
* Proteção de rotas privadas;
* Utilização de variáveis de ambiente;
* Validação dos dados recebidos pela aplicação;
* Configuração adequada do acesso ao banco;
* Utilização de políticas de segurança no Supabase;
* Não armazenamento de credenciais diretamente no código;
* Não publicação de senhas, tokens ou chaves privadas no GitHub.

---

# 📄 Documentação Disponível

| Documento                    | Caminho                             |
| ---------------------------- | ----------------------------------- |
| 🗄️ Tabelas do banco         | `Database/tables/`                  |
| 📐 Diagramas                 | `docs/diagramas/`                   |
| 🗃️ DER                      | `docs/DER.md`                       |
| 📋 Escopo do Projeto         | `docs/Escopo_Projeto.md`            |
| ⚖️ Lei 15.211/2025           | `docs/Lei152112025.md`              |
| ✅ Requisitos Funcionais      | `docs/Requisitos_Funcionais.md`     |
| ⚙️ Requisitos Não Funcionais | `docs/Requisitos_Não_Funcionais.md` |
| 💻 Aplicação Web             | `smartfix-app/`                     |

---

# 🤝 Contribuição

O desenvolvimento do SmartFix utiliza **Git e GitHub** para controle de versão e colaboração.

## Criar uma nova branch

```bash
git checkout -b nome-da-branch
```

## Registrar alterações

```bash
git add .
git commit -m "Descrição da alteração"
```

## Enviar a branch

```bash
git push origin nome-da-branch
```

Após o envio, poderá ser aberto um **Pull Request** para revisão e integração das alterações ao projeto.

---

# 🌱 Status do Projeto

> 🚧 **Projeto em desenvolvimento**

O SmartFix encontra-se em processo contínuo de desenvolvimento.

Novas funcionalidades, melhorias de interface, integrações, documentação e ajustes de arquitetura serão incorporados conforme a evolução do projeto.

---

<div align="center">

## 🔧 SmartFix

### Tecnologia para tornar a manutenção de dispositivos eletrônicos mais simples, organizada e transparente.

**Next.js • TypeScript • Supabase • PostgreSQL**

<br>

Projeto desenvolvido para fins acadêmicos e de desenvolvimento de software.

</div>
