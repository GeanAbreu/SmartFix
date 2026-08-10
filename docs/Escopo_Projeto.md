# SMARTFIX — ESCOPO DO PROJETO

**Data da Atualização:** Agosto / 2026  
**Autores / Sócios:** Arthur Fortunato, Flávio Henrique, Gean Silva, Lucas Mohr, Gabriel Fogaça.

---

## 1. VISÃO GERAL

### 1.1 Histórico e Descrição do Projeto
O projeto SmartFix surgiu a partir da necessidade observada no mercado por soluções mais rápidas, seguras e convenientes para a manutenção de dispositivos eletrônicos. Atualmente, usuários enfrentam dificuldades como falta de tempo para ir até assistências técnicas, incerteza sobre preços e prazos, e pouca transparência no processo de reparo.

O SmartFix é uma plataforma digital marketplace em nuvem que conecta clientes a assistências técnicas credenciadas, oferecendo um serviço prático, transparente e confiável.

A solução permitirá ao usuário solicitar orçamentos de reparo para smartphones, notebooks, tablets e outros eletrônicos, agendar a logística de coleta/entrega, acompanhar o status do serviço em tempo real e realizar o pagamento de forma 100% segura via Web.

### 1.2 Objetivos Principais
* Facilitar o acesso a serviços de assistência técnica por meio da tecnologia.
* Garantir transparência no diagnóstico, orçamento e execução dos reparos.
* Oferecer uma experiência fluida para o cliente via navegador (mobile e desktop) sem a necessidade de download obrigatório em lojas de aplicativos.

---

## 2. ESCOPO DO PROJETO

### 2.1 O que faz parte do escopo (In-Scope)
* **Plataforma Web Responsiva (PWA):** Acesso universal via celular, tablet ou computador.
* **Módulo do Cliente:** Solicitação de serviços, upload de mídias do defeito, acompanhamento em tempo real, aprovação de orçamento, pagamento e avaliações.
* **Painel da Assistência Técnica (Parceiro):** Recebimento de demandas, triagem, envio de diagnósticos/orçamentos, gestão do status de reparo e atualização de ordem de serviço (OS).
* **Painel Administrativo SmartFix:** Gestão de usuários, credenciamento de assistências parceiras, moderação de avaliações e relatórios/indicadores do sistema.
* **Módulo de Logística:** Agendamento e rastreio de coleta/entrega do dispositivo.
* **Sistema de Pagamento Integrado:** Suporte a PIX e Cartão de Crédito com retenção/repasse de valores.

### 2.2 O que NÃO faz parte do escopo (Out-of-Scope)
* Fabricação, venda ou revenda de dispositivos eletrônicos ou peças.
* Execução direta dos reparos pela equipe SmartFix (serviços executados exclusivamente por parceiros credenciados).
* Criação de frota logística própria (utilização de APIs/parceiros de logística terceirizados).
* Expansão nacional imediata (foco inicial em operação piloto regional).
* Lançamento de aplicativos nativos nas lojas (iOS/Android) no MVP (substituído por Web App responsivo/PWA).

---

## 3. ARQUITETURA TÉCNICA

* **Front-end:** React / Next.js com TypeScript e Tailwind CSS (Interface rápida, responsiva e SEO-friendly).
* **Back-end:** Node.js (via Next.js API Routes / Serverless Functions).
* **Banco de Dados & Autenticação:** PostgreSQL gerenciado via Supabase (Garantia de integridade relacional, segurança ACID e atualizações em tempo real).
* **Hospedagem:** Vercel (Front-end) + Supabase (Database/Auth/Storage).

---


## 4. RESULTADOS ESPERADOS ENTREGÁVEIS (MVP)

Ao final do ciclo de desenvolvimento, serão entregues:

1. **Web App SmartFix Funcional:** Aplicação web responsiva rodando em ambiente de produção com domínio próprio.
2. **Painel do Operador/Técnico:** Interface completa para gestão de Ordens de Serviço.
3. **Painel do Administrador:** Ferramenta de controle de parceiros e métricas.
4. **Documentação Técnica e de Negócio:** Modelo de dados relacional, diagrama de fluxos e guia da API.
