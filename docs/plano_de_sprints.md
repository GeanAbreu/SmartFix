# 📄 SmartFix - Plano Integrado de Sprints & Monografia

**Documentação Executiva de Backlog, Cobertura de Requisitos e Rastreabilidade Acadêmica**  
**Projeto:** SmartFix PWA Marketplace | **Arquitetura:** Next.js + Supabase / MySQL + Vercel  
**Total de Cartões:** 98 Cartões (69 de Desenvolvimento + 29 de Monografia/ABNT)  

---

## 📊 1. Visão Geral do Projeto

Este documento integra o desenvolvimento técnico da plataforma **SmartFix** à documentação acadêmica da **Monografia**. O plano divide os **98 cartões do Trello** ao longo de **4 Sprints**, garantindo paralelismo entre a codificação do sistema e a escrita do texto final.

| Indicador | Quantidade / Status |
|---|---|
| **Total de Cartões no Trello** | 98 Cartões |
| **Cobertura de Requisitos Funcionais** | 21/21 RFs (100%) |
| **Cobertura de Requisitos Não-Funcionais** | 10/10 RNFs (100%) |
| **Ciclo de Entrega** | 4 Sprints Integradas |

---

## 🗓️ 2. Distribuição dos Cartões por Sprint

### 🟢 SPRINT 1: Fundação, Autenticação, Limpeza e Banco de Dados (25 Cartões)
* **Objetivo Técnico:** Setup da aplicação Next.js, autenticação, perfis de usuários e banco de dados.
* **Objetivo Acadêmico:** Limpeza das imagens antigas de protótipos e criação dos scripts DDL/relatórios técnicos de banco.

| # | Título do Cartão / Atividade | Módulo / Categoria | Tipo |
|---|---|---|---|
| #01 | [Setup] Configuração do repositório Next.js com PWA e Tailwind | Infra / Frontend | Dev |
| #02 | [Supabase] Criação do projeto e configuração do banco PostgreSQL/MySQL | Backend / DB | Dev |
| #03 | [DB Schema] Modelagem inicial de Usuários, Perfis e Roles | Modelagem | Dev |
| #04 | [UI/UX] Design System, paleta de cores e componentes base | Design | Dev |
| #05 | [Front] Layout base e navegação responsiva (Navbar / Bottombar) | Frontend | Dev |
| #06 | [Auth] Configuração das rotas protegidas e middleware de sessão | Segurança | Dev |
| #07 | [Supabase] Configuração de Row Level Security (RLS) nas tabelas | Segurança | Dev |
| #08 | [Auth] Tela e formulário de Login (Cliente, Assistência, Admin) | Frontend | Dev |
| #09 | [Auth/Back] API de Autenticação e criação de JWT | Backend | Dev |
| #10 | [Auth] Cadastro de Clientes com validação de CPF e dados | Frontend / API | Dev |
| #11 | [Auth] Cadastro de Assistências Técnicas e Dados da Empresa | Frontend / API | Dev |
| #12 | [Auth] Fluxo de Recuperação e Redefinição de Senha via e-mail | Auth / Email | Dev |
| #13 | [Perfil] Visualização e Edição de Perfil do Cliente | Frontend | Dev |
| #14 | [Perfil] Cadastro e Gestão de Múltiplos Endereços | Frontend / API | Dev |
| #15 | [Perfil] Gestão de Dados do Estabelecimento do Parceiro | Frontend | Dev |
| #16 | [Admin] Tela de pré-cadastro e solicitação de credenciamento | Admin / Parceiro | Dev |
| #17 | [OAuth] Configuração do Provedor Google no Supabase Auth | Auth | Dev |
| #18 | [LGPD] Modal e Páginas de Termos de Uso e Privacidade | Legal | Dev |
| M01 | [Monografia] Remover Protótipos de Login e Cadastro | Acadêmico | Monografia |
| M02 | [Monografia] Criar Seção "Relatórios de Desenvolvimento Técnicos" | Acadêmico / ABNT | Monografia |
| M03 | [Monografia] Script SQL - Tabela de Usuários e Autenticação | Banco de Dados | Monografia |
| M04 | [Monografia] Script SQL - Tabela de Clientes e Dispositivos | Banco de Dados | Monografia |
| M05 | [Monografia] Script SQL - Tabela de Ordens de Serviço (OS) | Banco de Dados | Monografia |
| M06 | [Monografia] Configuração do Cloud Server e MySQL Server | Infraestrutura | Monografia |
| M07 | [Monografia] Relatório Técnico - Modelagem e Script de Banco | Documentação | Monografia |

---

### 🔵 SPRINT 2: Abertura de Chamados, APIs Backend e Logística (27 Cartões)
* **Objetivo Técnico:** Módulo de chamados, estimativas de preços, geolocalização e canal de comunicação.
* **Objetivo Acadêmico:** Redação dos relatórios técnicos das APIs do backend (Autenticação, Triagem e Logística).

| # | Título do Cartão / Atividade | Módulo / Categoria | Tipo |
|---|---|---|---|
| #19 | [Chamados] Seleção dinâmica de Tipo de Dispositivo, Marca e Modelo | Frontend | Dev |
| #20 | [Chamados] Formulário de descrição do defeito e sintomas | Frontend | Dev |
| #21 | [Storage] Upload de fotos/vídeos do aparelho | Backend / Storage | Dev |
| #22 | [Geo] Cálculo de distância e busca de assistências por raio/CEP | Backend / Geo | Dev |
| #23 | [Chamados] Estimativa automática prévia de preço e prazo médio | Regra de Negócio | Dev |
| #24 | [Agendamento] Escolha da modalidade: Coleta Domiciliar ou Presencial | Frontend | Dev |
| #25 | [Agendamento] Seletor de Data e Horário para coleta/atendimento | Frontend | Dev |
| #26 | [Coleta] Confirmação e geração do pedido de coleta logística | Backend | Dev |
| #27 | [Parceiro] Painel de Chamados Regionais Recebidos | Painel Parceiro | Dev |
| #28 | [Parceiro] Aceite ou Recusa de solicitação de atendimento | Painel Parceiro | Dev |
| #29 | [Orçamento] Formulário para emissão de diagnóstico técnico e peças | Painel Parceiro | Dev |
| #30 | [Orçamento] Geração do orçamento detalhado discriminado | Backend | Dev |
| #31 | [Tracking] Criação do token e link de acompanhamento público sem login | Public Route | Dev |
| #32 | [Tracking] Interface pública responsiva de status da OS por QR Code | Frontend | Dev |
| #33 | [Realtime] Atualização instantânea do status do reparo | Realtime | Dev |
| #34 | [UX] Layout e Componentes para Páginas de Erro 404 e 500 | UX | Dev |
| #35 | [E-mail] Integração com Resend API para e-mails transacionais | Comunicação | Dev |
| #36 | [WhatsApp] Webhook de notificação simplificada no WhatsApp | Integrations | Dev |
| #37 | [Aprovação] Tela para cliente aprovar ou recusar orçamento enviado | Frontend Cliente | Dev |
| M08 | [Monografia] Remover Protótipos de Triagem e Busca | Acadêmico | Monografia |
| M09 | [Monografia] Script SQL - Tabela de Caixas e Logística | Banco de Dados | Monografia |
| M10 | [Monografia] Relatório Técnico - Infraestrutura de Nuvem | Documentação | Monografia |
| M11 | [Monografia] Programar API de Autenticação e Hash de Senha | Backend | Monografia |
| M12 | [Monografia] Relatório Técnico - Módulo de Autenticação | Documentação | Monografia |
| M13 | [Monografia] Programar API de Vínculo de Dispositivo e Triagem | Backend | Monografia |
| M14 | [Monografia] Relatório Técnico - Módulo de Triagem | Documentação | Monografia |
| M15 | [Monografia] Programar API de Integração com Serviço de Logística | Backend | Monografia |

---

### 🟡 SPRINT 3: Aprovação, Pagamentos, Status e PWA (22 Cartões)
* **Objetivo Técnico:** Maquinário de status da OS, checkout com PIX/Cartão, comprovantes e PWA.
* **Objetivo Acadêmico:** Relatórios de transição de status, envio de notificações e remoção de mockups de pagamento.

| # | Título do Cartão / Atividade | Módulo / Categoria | Tipo |
|---|---|---|---|
| #38 | [Orçamento] API de aceite/recusa do orçamento com justificativa | Backend | Dev |
| #39 | [Status] Máquina de estados da OS (Aguardando, Reparo, Concluído) | Core Engine | Dev |
| #40 | [Status] Histórico de alterações e auditoria de status da OS | Backend / DB | Dev |
| #41 | [Gateway] Integração com gateway de pagamento (Mercado Pago / Stripe) | Payments | Dev |
| #42 | [Pagamento] Gerador de Cobrança PIX com QR Code dinâmico | Payments | Dev |
| #43 | [Pagamento] Checkout com Cartão de Crédito e Tokenização PCI-DSS | Payments / Seg | Dev |
| #44 | [Webhook] Processamento de Webhook de confirmação de pagamento | Backend API | Dev |
| #45 | [Comprovante] Emissão e download de comprovante digital de serviço | Frontend / PDF | Dev |
| #46 | [Financeiro] Extrato de transações e recebimentos do Parceiro | Painel Parceiro | Dev |
| #47 | [Avaliação] Formulário de avaliação do serviço (1 a 5 estrelas) | Frontend Cliente | Dev |
| #48 | [Avaliação] Cálculo dinâmico e exibição da média de notas | Backend / SQL | Dev |
| #49 | [PWA] Implementação do Service Worker para suporte Offline-first | PWA | Dev |
| #50 | [PWA] Web Push Notifications via Service Worker | PWA Push | Dev |
| #51 | [PWA] Manifesto PWA, ícones adaptativos e prompt de instalação | Frontend PWA | Dev |
| #52 | [Notificação] Central de notificações in-app no perfil do usuário | Frontend / DB | Dev |
| #53 | [Garantia] Registro de prazos de garantia e suporte ao cliente | Backend | Dev |
| M16 | [Monografia] Remover Protótipos de Orçamento e Checkout | Acadêmico | Monografia |
| M17 | [Monografia] Programar API de Acompanhamento e Atualização de OS | Backend | Monografia |
| M18 | [Monografia] Relatório Técnico - Máquina de Estados da OS | Documentação | Monografia |
| M19 | [Monografia] Relatório Técnico - Integração de Logística | Documentação | Monografia |
| M20 | [Monografia] Programar Envio de Notificações | Backend | Monografia |
| M21 | [Monografia] Relatório Técnico - Notificações ao Cliente | Documentação | Monografia |

---

### 🔴 SPRINT 4: Painel Admin, QA, Deploy e Finalização Acadêmica (24 Cartões)
* **Objetivo Técnico:** Dashboard Administrativo, sanitização, Sentry, testes e deploy final na Vercel.
* **Objetivo Acadêmico:** Captura dos prints reais do software operando, matriz de rastreabilidade de RFs e varredura ABNT.

| # | Título do Cartão / Atividade | Módulo / Categoria | Tipo |
|---|---|---|---|
| #54 | [Admin] Dashboard do Administrador com métricas globais e KPIs | Painel Admin | Dev |
| #55 | [Admin] Módulo de aprovação e auditoria de parceiros pendentes | Painel Admin | Dev |
| #56 | [Admin] Visão global de todas as OSs com filtros por status/região | Painel Admin | Dev |
| #57 | [Admin] Central de mediação de disputas entre cliente e parceiro | Painel Admin | Dev |
| #58 | [Segurança] Sanitização de entradas com Zod Schema e Rate Limiting | Backend / Seg | Dev |
| #59 | [Sentry] Monitoramento de erros e exceções em tempo real | DevOps | Dev |
| #60 | [Performance] Otimização de imagens, Next.js Bundle e Caching | Performance | Dev |
| #61 | [Auditoria] Verificação de Headers de Segurança (HTTPS, CSP, CORS) | DevOps / Seg | Dev |
| #62 | [QA] Testes de navegação e usabilidade em múltiplos dispositivos | QA / UX | Dev |
| #63 | [QA] Bateria de testes nos fluxos críticos de pagamento e coleta | QA / Testes | Dev |
| #64 | [CI/CD] Pipeline de Build e Deploy automático na Vercel | DevOps | Dev |
| #65 | [Supabase] Teste e validação de backups automáticos e restores | Database | Dev |
| #66 | [Docs] Documentação técnica dos Endpoints da API no Swagger/Postman | Documentação | Dev |
| #67 | [Docs] Manual de Utilização do Sistema (Cliente, Parceiro e Admin) | Documentação | Dev |
| #68 | [Apresentação] Congelamento de Código (Code Freeze) e Teste de Carga | Finalização | Dev |
| #69 | [Apresentação] Preparação do ambiente de DEMO e dados de teste | Finalização | Dev |
| M22 | [Monografia] Remover Protótipos de Pós-Venda e Painel Admin | Acadêmico | Monografia |
| M23 | [Monografia] Desenvolver Interface Real de Login e Cadastro (+ Prints) | Frontend / ABNT | Monografia |
| M24 | [Monografia] Desenvolver Interface Real de Solicitação de Reparo (+ Prints) | Frontend / ABNT | Monografia |
| M25 | [Monografia] Desenvolver Interface Real de Acompanhamento (+ Prints) | Frontend / ABNT | Monografia |
| M26 | [Monografia] Desenvolver Painel Operacional da Assistência/Admin (+ Prints) | Frontend / ABNT | Monografia |
| M27 | [Monografia] Rastreabilidade entre Código e Requisitos Funcionais | Governança | Monografia |
| M28 | [Monografia] Varredura de Figuras e Ajustes ABNT | Normalização | Monografia |
| M29 | [Monografia] Leitura Final e Conclusão | Encerramento | Monografia |
