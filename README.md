# 🔧 SmartFix — Plataforma de Gerenciamento de Reparos Eletrônicos

<p align="center">
  <strong>Plataforma web para conectar clientes e assistências técnicas, centralizando todo o processo de manutenção de dispositivos eletrônicos.</strong>
</p>

<p align="center">
  Projeto desenvolvido utilizando Next.js, TypeScript, PostgreSQL e Supabase.
</p>

---

## 📌 Sobre o Projeto

O **SmartFix** é uma plataforma web desenvolvida para modernizar e simplificar o processo de solicitação, acompanhamento e gerenciamento de reparos em dispositivos eletrônicos.

A proposta é criar um ambiente centralizado no qual clientes possam cadastrar seus dispositivos, solicitar serviços de assistência técnica e acompanhar o andamento dos reparos.

Ao mesmo tempo, assistências técnicas parceiras podem utilizar a plataforma para receber solicitações, administrar atendimentos e organizar os serviços realizados.

O projeto busca proporcionar maior **organização, transparência, segurança e praticidade** durante todo o processo de manutenção.

---

## 🎯 Objetivo

O principal objetivo do SmartFix é digitalizar o processo tradicional de assistência técnica, criando uma plataforma capaz de conectar:

- 👤 **Clientes**
- 🛠️ **Assistências Técnicas**
- 👨‍💼 **Administradores**
- 📱 **Dispositivos cadastrados**
- 📋 **Solicitações de reparo**

A plataforma pretende centralizar informações que normalmente ficam distribuídas entre mensagens, ligações, anotações e diferentes sistemas.

---

## ✨ Principais Funcionalidades

### 👤 Cliente

O cliente poderá:

- Criar e acessar sua conta;
- Gerenciar seus dados pessoais;
- Cadastrar endereços;
- Cadastrar dispositivos eletrônicos;
- Solicitar serviços de assistência técnica;
- Acompanhar o andamento de reparos;
- Consultar histórico de solicitações.

### 🛠️ Assistência Técnica

As assistências parceiras poderão:

- Criar cadastro na plataforma;
- Gerenciar informações da assistência;
- Receber solicitações de clientes;
- Gerenciar atendimentos;
- Atualizar o status dos reparos;
- Consultar dispositivos vinculados às solicitações.

### 🛡️ Administração

O ambiente administrativo será responsável pelo gerenciamento da plataforma, incluindo:

- Gerenciamento de usuários;
- Gerenciamento de assistências técnicas;
- Aprovação de parceiros;
- Controle das informações da plataforma;
- Acompanhamento das operações do sistema.

---

## 🧰 Tecnologias Utilizadas

O SmartFix utiliza tecnologias modernas para desenvolvimento web.

| Tecnologia | Utilização |
|---|---|
| **Next.js** | Framework principal da aplicação |
| **React** | Construção das interfaces |
| **TypeScript** | Desenvolvimento tipado |
| **Node.js** | Ambiente de execução |
| **CSS** | Estilização das interfaces |
| **Supabase** | Backend e serviços da aplicação |
| **PostgreSQL** | Banco de dados relacional |
| **Git** | Controle de versão |
| **GitHub** | Hospedagem e colaboração do código |

---

# 📂 Estrutura do Projeto

O repositório foi organizado separando a aplicação, banco de dados e documentação.

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
│
└── README.md
```

---

# 🗄️ Banco de Dados

Os arquivos relacionados à estrutura do banco de dados estão armazenados em:

```text
Database/tables/
```

Essa pasta contém os scripts SQL utilizados para documentar e reproduzir as tabelas utilizadas pelo SmartFix.

Entre as entidades utilizadas pelo sistema estão:

```text
clients
client_addresses
client_devices
partner
```

### Caminho

```text
SmartFix/
└── Database/
    └── tables/
```

O banco de dados da aplicação utiliza **PostgreSQL**, integrado ao projeto através do **Supabase**.

---

# 📚 Documentação

Toda a documentação técnica e acadêmica do projeto está centralizada em:

```text
docs/
```

## 📐 Diagramas

```text
docs/diagramas/
```

Diretório destinado aos diagramas utilizados para representar visualmente a arquitetura, estrutura e modelagem do SmartFix.

---

## 🗃️ DER — Diagrama Entidade-Relacionamento

```text
docs/DER.md
```

Documentação referente ao **Diagrama Entidade-Relacionamento (DER)** do SmartFix.

O documento apresenta a organização das entidades do banco de dados e seus respectivos relacionamentos.

---

## 📋 Escopo do Projeto

```text
docs/Escopo_Projeto.md
```

Documento responsável por apresentar o escopo do SmartFix, seus objetivos, limites e principais características.

---

## ⚖️ Lei 15.211/2025

```text
docs/Lei152112025.md
```

Documento destinado às informações relacionadas à **Lei nº 15.211/2025** consideradas durante o desenvolvimento e documentação do projeto.

---

## ✅ Requisitos Funcionais

```text
docs/Requisitos_Funcionais.md
```

Contém os requisitos que representam as funcionalidades e comportamentos esperados do sistema.

Os requisitos funcionais especificam **o que o SmartFix deve fazer**.

---

## ⚙️ Requisitos Não Funcionais

```text
docs/Requisitos_Não_Funcionais.md
```

Contém os requisitos relacionados às características de qualidade e funcionamento da plataforma.

Podem envolver aspectos como:

- Segurança;
- Desempenho;
- Disponibilidade;
- Usabilidade;
- Manutenibilidade;
- Escalabilidade.

---

# 💻 Aplicação

O código-fonte principal da plataforma está localizado em:

```text
smartfix-app/
```

### Caminho

```text
SmartFix/
└── smartfix-app/
```

Essa pasta concentra a aplicação desenvolvida utilizando **Next.js + React + TypeScript**.

A estrutura interna segue o padrão de roteamento e organização do **Next.js App Router**.

---

# 🗂️ Organização Geral

A divisão principal do repositório segue três responsabilidades:

```text
SmartFix
│
├── Database
│     └── Banco de dados
│
├── docs
│     └── Documentação do projeto
│
└── smartfix-app
      └── Aplicação web
```

Essa organização permite separar claramente:

**Código da aplicação**

```text
smartfix-app/
```

**Scripts e documentação do banco**

```text
Database/tables/
```

**Documentação técnica e acadêmica**

```text
docs/
```

---

# 🚀 Executando o Projeto

## 1. Clone o repositório

```bash
git clone <URL-DO-REPOSITORIO>
```

Entre na pasta do projeto:

```bash
cd SmartFix
```

---

## 2. Acesse a aplicação

```bash
cd smartfix-app
```

---

## 3. Instale as dependências

```bash
npm install
```

---

## 4. Configure as variáveis de ambiente

Crie o arquivo:

```text
.env.local
```

na pasta:

```text
smartfix-app/
```

As credenciais e configurações sensíveis da aplicação devem ser armazenadas através de variáveis de ambiente.

> ⚠️ Nunca publique chaves privadas, senhas ou credenciais do Supabase no GitHub.

---

## 5. Execute o ambiente de desenvolvimento

```bash
npm run dev
```

Depois, acesse a aplicação através do endereço informado pelo Next.js no terminal.

Por padrão:

```text
http://localhost:3000
```

---

# 🔐 Segurança

O projeto deve seguir boas práticas de segurança durante o desenvolvimento.

Entre elas:

- Não armazenar senhas diretamente nas tabelas da aplicação;
- Utilizar autenticação segura;
- Proteger rotas privadas;
- Utilizar variáveis de ambiente;
- Configurar políticas de acesso ao banco de dados;
- Validar dados recebidos pela aplicação;
- Não publicar credenciais no repositório.

---

# 🗄️ Modelagem

A arquitetura de dados do SmartFix busca separar as diferentes responsabilidades do sistema.

Exemplo simplificado:

```text
                ┌─────────────────┐
                │     CLIENTS     │
                └────────┬────────┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│  CLIENT_ADDRESSES   │   │   CLIENT_DEVICES    │
└─────────────────────┘   └─────────────────────┘


                ┌─────────────────┐
                │     PARTNER     │
                └─────────────────┘
```

A documentação completa da modelagem pode ser encontrada em:

```text
docs/DER.md
```

---

# 🌱 Status do Projeto

> 🚧 **Em desenvolvimento**

O SmartFix encontra-se em processo contínuo de desenvolvimento e evolução.

Novas funcionalidades, melhorias de interface, integrações e ajustes na arquitetura poderão ser adicionados conforme o avanço do projeto.

---

# 🤝 Contribuição

O desenvolvimento do SmartFix utiliza **Git e GitHub** para controle de versão e colaboração.

Para contribuir:

```bash
git checkout -b nome-da-branch
```

Após realizar as alterações:

```bash
git add .
git commit -m "Descrição da alteração"
git push origin nome-da-branch
```

Posteriormente, poderá ser aberto um **Pull Request** para revisão e integração das alterações.

---

# 📄 Documentação disponível

| Documento | Caminho |
|---|---|
| 🗄️ Tabelas do banco | `Database/tables/` |
| 📐 Diagramas | `docs/diagramas/` |
| 🗃️ DER | `docs/DER.md` |
| 📋 Escopo do Projeto | `docs/Escopo_Projeto.md` |
| ⚖️ Lei 15.211/2025 | `docs/Lei152112025.md` |
| ✅ Requisitos Funcionais | `docs/Requisitos_Funcionais.md` |
| ⚙️ Requisitos Não Funcionais | `docs/Requisitos_Não_Funcionais.md` |
| 💻 Aplicação | `smartfix-app/` |

---

# 🔧 SmartFix

**Tecnologia para tornar a manutenção de dispositivos eletrônicos mais simples, organizada e transparente.**

Projeto desenvolvido para fins acadêmicos e de desenvolvimento de software.
