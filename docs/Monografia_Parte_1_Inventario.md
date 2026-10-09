# SmartFix - Parte 1: inventario funcional e tecnico

**Data do levantamento:** 3 de outubro de 2026  
**Finalidade:** estabelecer a verdade tecnica que servira de base para a atualizacao da monografia.  
**Criterio:** uma funcionalidade so e classificada como implementada quando existem evidencias no codigo atual. Documentos de intencao, prototipos e requisitos antigos nao sao considerados prova de implementacao.

## 1. Classificacao adotada

| Situacao | Significado |
| --- | --- |
| Implementado | Ha interface ou API, regra de negocio e persistencia/servico correspondentes no repositorio atual. |
| Implementado com configuracao | O recurso existe, mas depende de credenciais ou servico externo para operar. |
| Parcial | Parte da infraestrutura existe, mas a experiencia ou o fluxo ainda nao esta completo. |
| Planejado | Consta no escopo ou nos requisitos, mas nao foi localizado no codigo produtivo. |
| Divergente | A documentacao afirma algo diferente do que o codigo e o README atual demonstram. |

## 2. Visao confirmada do produto

O SmartFix atual e uma plataforma web responsiva que organiza o relacionamento entre clientes e assistencias tecnicas durante o ciclo de reparo de dispositivos eletronicos. A aplicacao possui tres contextos de acesso:

1. cliente;
2. assistencia tecnica parceira;
3. administrador SmartFix.

O fluxo produtivo confirmado cobre cadastro, enderecos, dispositivos, descoberta de assistencias, solicitacao de reparo, triagem inicial, diagnostico, orcamento, aprovacao ou cancelamento, acompanhamento de status, notificacoes, mensagens de suporte e avaliacao. Pagamento integrado e logistica de coleta/entrega ainda nao integram esse fluxo.

## 3. Matriz de funcionalidades

### 3.1 Acesso e conta

| Funcionalidade | Situacao | Evidencia principal | Observacao para a monografia |
| --- | --- | --- | --- |
| Cadastro de cliente | Implementado | `app/cadastro/page.tsx`, `app/api/auth/register/route.ts` | Descrever validacoes cadastrais e criacao da conta. |
| Cadastro de parceiro | Implementado | `app/cadastro/page.tsx`, modelos `Partner` e `ClientAddress` | O parceiro depende de aprovacao administrativa. |
| Login por senha | Implementado | `app/login/page.tsx`, `app/api/auth/login/route.ts` | A senha e protegida com bcrypt. |
| Logout | Implementado | `app/api/auth/logout/route.ts` | A sessao e revogada no servidor. |
| Sessao assinada | Implementado | `src/services/session.service.ts` | Deve compor a secao de seguranca. |
| Recuperacao de senha | Implementado com configuracao | `PasswordRecovery.tsx`, `RecoveryController.ts`, `email.service.ts` | O envio depende da configuracao do provedor de e-mail. |
| Login e vinculacao Google | Implementado com configuracao | rotas em `app/api/auth/google` e `GoogleController.ts` | Sem credenciais OAuth, a interface informa indisponibilidade. |
| Edicao do perfil do cliente | Implementado | `ClientProfilePage.tsx`, `app/api/clients/me/route.ts` | Permite atualizar dados pessoais e de contato. |
| Termos de uso e privacidade | Implementado como paginas informativas | `app/termos/page.tsx`, `app/privacidade/page.tsx` | O conteudo juridico deve ser revisado antes de ser apresentado como conformidade plena. |

### 3.2 Modulo do cliente

| Funcionalidade | Situacao | Evidencia principal | Observacao para a monografia |
| --- | --- | --- | --- |
| Dashboard do cliente | Implementado | `ClientDashboard.tsx` | Resume notificacoes, reparos recentes e pendencias. |
| Cadastro de varios enderecos | Implementado | `AddressManager.tsx`, APIs `clients/addresses` | Inclui edicao, exclusao e escolha do endereco principal. |
| Cadastro de dispositivos | Implementado | `DeviceManager.tsx`, APIs `clients/devices` | Registra tipo, fabricante, modelo, serie, apelido e dados do defeito. |
| Foto do dispositivo | Parcial | `DeviceManager.tsx` | A interface exibe foto quando ha URL, mas nao foi identificado fluxo completo de upload/armazenamento de arquivo. |
| Busca de assistencias proximas | Implementado | `AssistanceFinder.tsx`, `DiscoveryController.ts` | Usa assistencias aprovadas, geocodificacao e calculo de distancia. |
| Mapa de assistencias | Implementado | `AssistanceMap.tsx` | Usa Leaflet; OpenStreetMap/Photon participam da localizacao. |
| Consulta de servicos e precos-base | Implementado | API `partners/[id]/services`, `AssistanceFinder.tsx` | Preco-base e referencia; o valor final vem do orcamento. |
| Consulta de avaliacoes | Implementado | API `partners/[id]/reviews`, `AssistanceFinder.tsx` | Exibe media e comentarios das avaliacoes persistidas. |
| Solicitacao de reparo | Implementado | `RepairRequest.tsx`, API `orders` | Exige dispositivo, parceiro e descricao valida. |
| Triagem inicial | Implementado | `repair-request-draft.ts`, `workflow.ts` | Inclui sintomas e checklist do estado/acessorios. |
| Historico de reparos | Implementado | `ClientOrders.tsx` | Possui busca, filtros e historico de transicoes. |
| Aprovacao de orcamento | Implementado | `order-policy.service.ts` | Permitida ao cliente quando a ordem esta em `quoted`. |
| Recusa/cancelamento | Implementado | `order-policy.service.ts` | Permitido antes da aprovacao, nos estados `pending` e `quoted`. |
| Avaliacao da assistencia | Implementado | `ClientReviews.tsx`, acao `review` | Permitida uma unica vez, apos a conclusao. |
| Notificacoes | Implementado | APIs `notifications`, dashboard e pagina de notificacoes | Inclui marcacao de leitura. |
| Central de ajuda e FAQ | Implementado | `HelpCenter.tsx` | Contatos oficiais continuam a definir. |
| Conversa com suporte | Implementado para o cliente | `HelpCenter.tsx`, APIs `support/messages` | Mensagens sao persistidas no PostgreSQL; nao ha anexos ou respostas automaticas. |

### 3.3 Modulo da assistencia tecnica

| Funcionalidade | Situacao | Evidencia principal | Observacao para a monografia |
| --- | --- | --- | --- |
| Dashboard do parceiro | Implementado | `PartnerDashboard.tsx` | Resume ordens que exigem atencao e notificacoes. |
| Catalogo de servicos | Implementado | `PartnerServices.tsx`, APIs `services` | Permite cadastrar e editar nome, descricao, preco-base e prazo. |
| Recebimento de solicitacoes | Implementado | `PartnerOrders.tsx` | O parceiro visualiza apenas ordens vinculadas a sua conta. |
| Diagnostico tecnico | Implementado | `PartnerOrders.tsx`, acao `quote` | Diagnostico e obrigatorio para emitir o orcamento. |
| Orcamento detalhado | Implementado | `order-policy.service.ts` | Aceita ate 30 itens com quantidade e valor unitario. |
| Atualizacao do reparo | Implementado | `order-policy.service.ts` | Transicoes sao controladas por estado e perfil. |
| Notificacoes do parceiro | Implementado | pagina `parceiro/notificacoes` | Tambem aparecem no dashboard. |
| Atendimento visual ao cliente | Parcial | APIs `partners/support/conversations` | O backend existe, mas a documentacao confirma que o painel visual ainda sera desenvolvido. |

### 3.4 Administracao

| Funcionalidade | Situacao | Evidencia principal | Observacao para a monografia |
| --- | --- | --- | --- |
| Acesso administrativo restrito | Implementado | `page-authorization.service.ts`, `ADMIN_USER_IDS` | Nao existe cadastro publico de administrador. |
| Listagem de parceiros | Implementado | `app/admin/parceiros/page.tsx`, API `partners` | Serve ao processo de credenciamento. |
| Aprovacao de parceiros | Implementado | API `partners/[id]/approval` | Somente parceiros aprovados entram na descoberta geografica. |
| APIs de atendimento SmartFix | Implementado | APIs `admin/support/conversations` | Permitem listar conversas, ler e responder. |
| Painel visual de atendimento | Parcial | `docs/chat-ajuda.md` | Backend pronto; interface administrativa ainda nao localizada. |
| Gestao completa de usuarios | Planejado | requisito RF 7.03 | Nao foi encontrada interface administrativa completa para usuarios. |
| Moderacao de avaliacoes | Planejado | `docs/Escopo_Projeto.md` | Nao foi localizado fluxo produtivo de moderacao. |
| Relatorios e indicadores gerais | Planejado | `docs/Escopo_Projeto.md` | Os dashboards atuais sao operacionais, nao um modulo analitico administrativo completo. |

### 3.5 Recursos planejados ou nao confirmados

| Funcionalidade | Situacao | Evidencia | Tratamento correto na monografia |
| --- | --- | --- | --- |
| Pagamento por PIX/cartao | Planejado | README informa que nao integra o fluxo atual | Apresentar como trabalho futuro, nao como resultado entregue. |
| Historico/comprovante de pagamento | Planejado | Nao ha modelo, tabela ou API de pagamento | Retirar dos requisitos implementados. |
| Coleta e entrega | Planejado | README informa que nao integra o fluxo atual | Manter somente na evolucao do produto. |
| Rastreamento logistico | Planejado | Nao ha modulo produtivo | Nao atribuir ao sistema atual. |
| Entregador como perfil operacional | Divergente | Citado em documento legal, ausente do sistema atual | Remover do modelo atual ou marcar como perfil futuro. |
| Aplicativo nativo Android/iOS | Fora do escopo atual | Projeto atual e web | Substituir a descricao antiga em Flutter/Dart/Kotlin. |
| PWA instalavel | Nao confirmado | Nao foram localizados manifesto e service worker no inventario inicial | Nao chamar a plataforma de PWA ate implementacao comprovada. |
| Tailwind CSS | Divergente | O codigo utiliza CSS Modules e `globals.css` | Corrigir a documentacao de arquitetura. |
| Autenticacao fornecida pelo Supabase | Divergente | A aplicacao usa sessao propria e PostgreSQL pelo servidor | Supabase atua como provedor PostgreSQL; nao descrever acesso direto do navegador as tabelas. |
| Upload de midias do defeito | Planejado/parcial | Nao ha fluxo completo de upload identificado | Diferenciar dados textuais/foto por URL de upload de arquivos. |

## 4. Fluxo de ordem de servico confirmado

Estados atuais:

1. `pending` - aguardando diagnostico;
2. `quoted` - aguardando aprovacao;
3. `approved` - orcamento aprovado;
4. `in_progress` - em reparo;
5. `waiting_parts` - aguardando pecas;
6. `ready` - pronto para retirada;
7. `completed` - concluido;
8. `cancelled` - cancelado.

Regras principais:

- a assistencia pode emitir ou revisar o orcamento enquanto a ordem esta pendente ou cotada;
- somente o cliente da ordem pode aprovar o orcamento;
- o cliente pode cancelar antes da aprovacao;
- somente a assistencia vinculada pode avancar as etapas tecnicas;
- uma ordem em reparo pode ir para espera de pecas ou ficar pronta;
- uma ordem em espera de pecas pode voltar ao reparo;
- somente uma ordem pronta pode ser concluida;
- a avaliacao e permitida ao cliente depois da conclusao e nao pode ser repetida.

## 5. Arquitetura confirmada

| Camada | Implementacao atual |
| --- | --- |
| Interface | Next.js 16, React 19, TypeScript e CSS Modules |
| Rotas web | App Router do Next.js |
| API | Route Handlers do Next.js |
| Organizacao interna | Controllers, services, policies, validations, models e repository |
| Validacao | Zod |
| ORM | Sequelize |
| Banco | PostgreSQL, compativel com Supabase Postgres |
| Autenticacao | Sessao assinada, bcrypt e Google OAuth opcional |
| Localizacao | Leaflet, OpenStreetMap, Photon e calculo de distancia |
| E-mail | Provedor Resend opcional |
| Qualidade | ESLint, TypeScript, Node Test Runner e validacoes de banco |

O navegador consome APIs da propria aplicacao. O acesso ao PostgreSQL ocorre no servidor. As tabelas possuem Row Level Security habilitado e a aplicacao reforca as permissoes por sessao e por regras de negocio.

## 6. Persistencia confirmada

Entidades principais identificadas:

- clientes;
- parceiros;
- enderecos de cliente ou parceiro;
- dispositivos;
- ordens de reparo;
- avaliacoes;
- servicos oferecidos por parceiros;
- registros auxiliares de workflow;
- mensagens de suporte.

O repositorio possui tabelas-base e oito migrations datadas entre 9 de setembro e 2 de outubro de 2026. As migrations tratam persistencia, normalizacao de enderecos, DER, defeito do dispositivo, catalogo de servicos, chat e remocao de colunas sem uso.

## 7. Evidencias de qualidade disponiveis

Foram identificados 16 arquivos de teste automatizado cobrindo:

- validacoes de autenticacao, endereco e dispositivo;
- configuracao do banco;
- modelos de endereco e dispositivo;
- descoberta geografica;
- politicas de endereco e de ordens;
- dashboards de cliente e parceiro;
- integracao do cadastro com endereco;
- rascunho da solicitacao de reparo;
- servicos de seguranca;
- workflow integrado.

O `package.json` tambem fornece comandos para testes, lint, build, migrations, verificacao do schema, smoke test do banco e importacao de dados locais. Os resultados numericos somente devem entrar na monografia depois da execucao registrada desses comandos.

## 8. Divergencias documentais a corrigir

1. `docs/Escopo_Projeto.md` apresenta pagamento e logistica dentro do escopo entregue, mas o README atual os classifica como evolucao planejada.
2. O mesmo documento cita Tailwind CSS, embora a aplicacao atual utilize CSS Modules.
3. A documentacao antiga e a monografia apresentam aplicativo movel, Flutter, Dart, Kotlin e Android Studio, que nao correspondem ao produto atual.
4. `docs/Lei152112025.md` menciona entregador, pagamentos e entregas como funcionalidades do sistema, sem correspondencia no codigo atual.
5. Os requisitos funcionais atuais misturam funcionalidades prontas e futuras sem indicar situacao.
6. Requisitos nao funcionais como resposta em tempo real, disponibilidade 24/7, carregamento em ate tres segundos, backups e escalabilidade ainda precisam de evidencias mensuraveis.
7. As paginas de termos e privacidade possuem trechos desatualizados em relacao aos modulos ja implementados.
8. A descricao de autenticacao deve deixar claro que o navegador nao usa diretamente a autenticacao ou as tabelas do Supabase.

## 9. Decisoes para a nova monografia

- tratar o SmartFix como plataforma web responsiva, nao como aplicativo movel nativo;
- descrever apenas funcionalidades comprovadas como resultados alcancados;
- colocar pagamento, logistica, moderacao, relatorios administrativos e PWA entre os trabalhos futuros, salvo implementacao posterior;
- apresentar recursos dependentes de configuracao externa com essa ressalva;
- basear requisitos, diagramas, arquitetura e telas no codigo de outubro de 2026;
- substituir integralmente os diagramas e prototipos que representem a arquitetura movel antiga;
- utilizar dados demonstrativos e nunca credenciais ou informacoes pessoais reais nos prints;
- reservar afirmacoes de desempenho, seguranca e disponibilidade para resultados que possam ser demonstrados por teste.

## 10. Resultado da Parte 1

A base funcional da nova monografia deve refletir um marketplace web de reparos com fluxo de ordem de servico, descoberta geografica, gestao de dispositivos e enderecos, catalogo de parceiros, notificacoes, suporte e avaliacoes. O documento nao deve apresentar pagamento ou logistica como recursos entregues na versao atual.

O proximo passo e a Parte 2: propor o sumario definitivo da monografia, mapeando o que sera mantido, reescrito, excluido ou criado em relacao ao PDF anterior e ao manual institucional.
