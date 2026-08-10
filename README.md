# 🛠️ SmartFix — Plataforma de Gerenciamento de Reparos Eletrônicos

> **SmartFix** é uma solução digital PWA (Progressive Web App) desenvolvida para conectar **Clientes**, **Assistências Técnicas**, **Entregadores** e **Administradores** em um ecossistema centralizado, transparente e seguro para manutenção de dispositivos eletrônicos.

---

## 📌 Índice
1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Principais Funcionalidades](#-principais-funcionalidades)
3. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
4. [Adequação à Lei Felca (ECA Digital)](#-adequação-à-lei-felca-eca-digital)
5. [Documentação do Projeto](#-documentação-do-projeto)

---

## 🚀 Sobre o Projeto

O SmartFix simplifica o processo tradicional de assistência técnica oferecendo um fluxo de atendimento fim-a-fim:
* Abertura de solicitação com triagem de defeitos.
* Matchmaking inteligente com assistências locais.
* Logística integrada via motoboys/entregadores.
* Acompanhamento em tempo real do status de reparo e pagamentos seguros.

---

## ✨ Principais Funcionalidades

- **Clientes:** Solicitação de orçamentos, acompanhamento de ordens de serviço (OS), aprovação/recusa de valores, pagamento via PIX/Cartão e avaliação de serviços.
- **Assistências Técnicas:** Recebimento de chamados, envio de orçamentos detalhados, atualização do status do reparo e emissão de finalizações.
- **Entregadores:** Aceite de solicitações de coleta/entrega, atualização de status de transporte e confirmação de recebimento.
- **Administradores:** Gestão de usuários, controle de permissões (RBAC) e monitoramento de logs operacionais.

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** Next.js (React), TailwindCSS, PWA.
- **Back-end:** Serverless API Routes (Node.js / Next.js App Router).
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL, Auth, Storage Engine).
- **Hospedagem & Deploy:** Vercel Edge Network.
- **Modelagem Visual:** Mermaid.js / UML.

---

## 🛡️ Adequação à Lei Felca (ECA Digital)

Em conformidade com a **Lei nº 15.211/2025 (Lei Felca / ECA Digital)**, o SmartFix adota práticas estritas de segurança da informação e proteção de dados:
- **Princípio da Minimização:** Coleta apenas dados estritamente necessários para a execução do serviço técnico.
- **Controle por Perfis (RBAC):** Níveis rígidos de acesso (Cliente, Prestador, Entregador e Admin), impedindo acesso indevido a dados de terceiros.
- **Sem Publicidade Direcionada ou Exposição Pública:** A plataforma é estritamente utilitária, sem feed de interação social ou rastreamento comportamental de menores.
- **Transparência e Rastreabilidade:** Todos os fluxos operacionais e transacionais são registrados em logs seguros.

---

## 📑 Documentação do Projeto

Toda a engenharia de requisitos, escopo, compliance e modelagem UML estão organizados na pasta [`/docs`](./docs/):

### 📋 Especificações do Sistema
* 📄 **[Escopo do Projeto](./docs/Escopo_Projeto.md)** — Visão geral, objetivos e limites do sistema SmartFix.
* 📄 **[Requisitos Funcionais](./docs/Requisitos_Funcionais.md)** — Mapeamento de todas as funcionalidades oferecidas para os usuários.
* 📄 **[Requisitos Não-Funcionais](./docs/Requisitos_N%C3%A3o_Funcionais.md)** — Critérios de desempenho, segurança, escalabilidade e usabilidade.
* 📄 **[Adequação à Lei 15.211/2025 (ECA Digital)](./docs/Lei152112025.md)** — Documentação de compliance e proteção de dados de menores.

---

### 📐 Modelagem de Dados e Arquitetura (UML)
* 🗄️ **[Modelo ER (DER)](./docs/DER.md)** — Diagrama Entidade-Relacionamento e especificação das tabelas.
* 📊 **[Visão Geral dos Diagramas UML](./docs/Diagramas_UML.md)** — Documento compilado com todas as visões arquiteturais.

#### 🔗 Diagramas Específicos (`docs/diagramas/`):
* 🔄 **[Diagrama de Atividades](./docs/diagramas/Diagrama_de_Atividades.md)**
* 👥 **[Diagrama de Casos de Uso](./docs/diagramas/Diagrama_de_Casos_Uso.md)**
* 🧩 **[Diagrama de Classes](./docs/diagramas/Diagrama_de_Classes.md)**
* 🏗️ **[Diagrama de Componentes](./docs/diagramas/Diagrama_de_Componentes.md)**
* 🔄 **[Diagrama de Gráfico de Estados](./docs/diagramas/Diagrama_de_Grafico_Estados.md)**
* 🚀 **[Diagrama de Implantação](./docs/diagramas/Diagrama_de_Implanta%C3%A7%C3%A3o.md)**
* ⏱️ **[Diagrama de Sequências](./docs/diagramas/Diagrama_de_Sequ%C3%AAncias.md)**
