# SmartFix - Parte 3: requisitos, regras de negócio e rastreabilidade

**Data:** 3 de outubro de 2026  
**Objetivo:** formalizar o comportamento da versão atual do SmartFix e separar requisitos entregues, condicionais, parciais e futuros.  
**Base:** código-fonte, banco de dados, testes automatizados, documentação consolidada nas Partes 1 e 2.

## 1. Convenções

### 1.1 Identificadores

- `RF`: requisito funcional da versão atual;
- `RNF`: requisito não funcional verificável ou tecnicamente sustentado;
- `RN`: regra de negócio;
- `RF-F`: requisito funcional futuro;
- `CA`: critério de aceite.

### 1.2 Situação

| Situação | Significado |
| --- | --- |
| Implementado | Fluxo disponível no código atual. |
| Condicional | Implementado, mas dependente de configuração externa. |
| Parcial | Apenas parte do fluxo está disponível. |
| Futuro | Não integra a versão produtiva atual. |
| Meta não aferida | Requisito desejado, mas ainda sem evidência quantitativa suficiente. |

### 1.3 Prioridade

| Prioridade | Significado |
| --- | --- |
| Essencial | Necessário ao fluxo principal ou à proteção dos dados. |
| Importante | Agrega capacidade relevante, mas o núcleo funciona sem ela. |
| Evolução | Previsto para versões posteriores. |

## 2. Atores

| Ator | Responsabilidade |
| --- | --- |
| Visitante | Consultar páginas públicas, criar conta e autenticar-se. |
| Cliente | Manter perfil, endereços e dispositivos; buscar parceiros; solicitar e acompanhar reparos; aprovar orçamento; conversar e avaliar. |
| Parceiro | Manter catálogo; receber ordens; diagnosticar, orçar e atualizar reparos; consultar notificações. |
| Administrador | Aprovar parceiros e acessar atendimentos direcionados à SmartFix. |
| Provedor de banco | Persistir dados PostgreSQL utilizados pelo servidor. |
| Provedor de geocodificação | Converter CEP ou localidade em coordenadas. |
| Provedor OAuth | Autenticar ou vincular conta Google quando configurado. |
| Provedor de e-mail | Enviar recuperação de senha quando configurado. |

## 3. Requisitos funcionais da versão atual

### 3.1 Cadastro, autenticação e sessão

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-01 | O sistema deve permitir o cadastro de cliente com dados pessoais, contato, senha e endereço inicial. | Visitante | Implementado | Essencial |
| RF-02 | O sistema deve permitir o cadastro de assistência técnica com dados pessoais/empresariais, senha e endereço. | Visitante | Implementado | Essencial |
| RF-03 | O sistema deve permitir autenticação por e-mail ou documento e senha. | Visitante | Implementado | Essencial |
| RF-04 | O sistema deve criar uma sessão assinada após autenticação válida e permitir sua consulta pelas áreas protegidas. | Sistema | Implementado | Essencial |
| RF-05 | O sistema deve permitir encerramento da sessão. | Cliente, parceiro, administrador | Implementado | Essencial |
| RF-06 | O sistema deve permitir solicitação e conclusão de redefinição de senha. | Visitante | Condicional | Importante |
| RF-07 | O sistema deve permitir autenticação ou vinculação de conta pelo Google. | Visitante ou cliente | Condicional | Importante |
| RF-08 | O sistema deve direcionar o usuário autenticado à área correspondente ao seu perfil. | Sistema | Implementado | Essencial |

### 3.2 Perfil e endereços

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-09 | O sistema deve permitir que o cliente consulte seus dados de conta e perfil. | Cliente | Implementado | Essencial |
| RF-10 | O sistema deve permitir que o cliente atualize nome e dados de contato autorizados. | Cliente | Implementado | Importante |
| RF-11 | O sistema deve permitir que o cliente liste seus endereços. | Cliente | Implementado | Essencial |
| RF-12 | O sistema deve permitir cadastrar, editar e excluir endereços secundários. | Cliente | Implementado | Essencial |
| RF-13 | O sistema deve permitir definir um endereço principal. | Cliente | Implementado | Essencial |

### 3.3 Dispositivos

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-14 | O sistema deve permitir listar os dispositivos pertencentes ao cliente autenticado. | Cliente | Implementado | Essencial |
| RF-15 | O sistema deve permitir cadastrar dispositivo com tipo, fabricante, modelo e dados complementares. | Cliente | Implementado | Essencial |
| RF-16 | O sistema deve permitir editar e excluir dispositivo pertencente ao cliente. | Cliente | Implementado | Essencial |
| RF-17 | O sistema deve validar combinações admitidas de tipo, fabricante e modelo. | Sistema | Implementado | Importante |
| RF-18 | O sistema deve aceitar URL de foto em formato permitido e exibi-la quando informada. | Cliente | Parcial | Importante |

O RF-18 não representa upload completo de arquivos. O fluxo atual valida e utiliza uma referência de imagem, mas não comprova armazenamento de mídia enviado pelo usuário.

### 3.4 Descoberta de assistências

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-19 | O sistema deve permitir escolher um endereço cadastrado, informar localidade ou utilizar coordenadas válidas como origem da busca. | Cliente | Implementado | Essencial |
| RF-20 | O sistema deve permitir selecionar um raio de busca entre os valores aceitos. | Cliente | Implementado | Importante |
| RF-21 | O sistema deve listar somente assistências aprovadas e localizadas dentro do raio escolhido. | Cliente | Implementado | Essencial |
| RF-22 | O sistema deve ordenar as assistências pela distância calculada e apresentar sua localização em mapa. | Cliente | Implementado | Importante |
| RF-23 | O sistema deve apresentar dados públicos, serviços ativos e avaliações da assistência selecionada. | Cliente | Implementado | Importante |

### 3.5 Solicitação e acompanhamento do reparo

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-24 | O sistema deve permitir criar uma solicitação vinculada a dispositivo próprio e assistência aprovada. | Cliente | Implementado | Essencial |
| RF-25 | O sistema deve coletar descrição do problema, sintomas e checklist de estado/acessórios. | Cliente | Implementado | Essencial |
| RF-26 | O sistema deve preservar temporariamente o rascunho válido durante a navegação do fluxo de solicitação. | Cliente | Implementado | Importante |
| RF-27 | O sistema deve permitir ao cliente listar, buscar e filtrar suas ordens de reparo. | Cliente | Implementado | Essencial |
| RF-28 | O sistema deve apresentar diagnóstico, orçamento, estado atual e histórico de cada ordem autorizada. | Cliente ou parceiro | Implementado | Essencial |
| RF-29 | O sistema deve permitir ao parceiro emitir diagnóstico e orçamento detalhado para uma ordem pendente ou já cotada. | Parceiro | Implementado | Essencial |
| RF-30 | O sistema deve permitir ao cliente aprovar orçamento pendente de decisão. | Cliente | Implementado | Essencial |
| RF-31 | O sistema deve permitir ao cliente cancelar uma ordem antes da aprovação do orçamento. | Cliente | Implementado | Essencial |
| RF-32 | O sistema deve permitir ao parceiro avançar a ordem pelas etapas técnicas autorizadas. | Parceiro | Implementado | Essencial |
| RF-33 | O sistema deve registrar o histórico das mudanças de estado da ordem. | Sistema | Implementado | Essencial |

### 3.6 Avaliações, notificações e suporte

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-34 | O sistema deve permitir uma avaliação de 1 a 5 estrelas, com comentário opcional, após a conclusão do reparo. | Cliente | Implementado | Importante |
| RF-35 | O sistema deve disponibilizar ao cliente e ao parceiro suas notificações e permitir marcar uma notificação como lida. | Cliente ou parceiro | Implementado | Importante |
| RF-36 | O sistema deve apresentar perguntas frequentes e informações de atendimento. | Cliente | Implementado | Importante |
| RF-37 | O sistema deve permitir que o cliente converse com a SmartFix ou com assistência elegível. | Cliente | Implementado | Importante |
| RF-38 | O sistema deve persistir mensagens textuais e recuperar o histórico da conversa autorizada. | Cliente, parceiro ou administrador | Implementado | Importante |

### 3.7 Operações do parceiro

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-39 | O sistema deve apresentar ao parceiro resumo de ordens e notificações relacionadas à sua conta. | Parceiro | Implementado | Essencial |
| RF-40 | O sistema deve permitir ao parceiro listar, criar e editar serviços do próprio catálogo. | Parceiro | Implementado | Essencial |
| RF-41 | O sistema deve permitir ao parceiro informar descrição, preço-base, prazo estimado e situação do serviço. | Parceiro | Implementado | Importante |
| RF-42 | O sistema deve permitir que o parceiro consulte apenas ordens vinculadas à sua assistência. | Parceiro | Implementado | Essencial |
| RF-43 | O sistema deve fornecer APIs para listar conversas elegíveis e responder clientes vinculados a ordens do parceiro. | Parceiro | Parcial | Importante |

O RF-43 é parcial porque o backend existe, mas não foi localizada interface visual completa para esse atendimento.

### 3.8 Operações administrativas

| ID | Requisito | Ator | Situação | Prioridade |
| --- | --- | --- | --- | --- |
| RF-44 | O sistema deve restringir funções administrativas aos identificadores configurados. | Administrador | Implementado | Essencial |
| RF-45 | O sistema deve permitir listar parceiros e consultar sua situação de aprovação. | Administrador | Implementado | Essencial |
| RF-46 | O sistema deve permitir aprovar ou retirar a aprovação de uma assistência. | Administrador | Implementado | Essencial |
| RF-47 | O sistema deve fornecer APIs para listar conversas dirigidas à SmartFix, ler mensagens e responder. | Administrador | Parcial | Importante |

O RF-47 é parcial porque as APIs estão disponíveis, mas não foi identificada uma interface administrativa completa de atendimento.

## 4. Critérios de aceite dos requisitos funcionais

### 4.1 Cadastro e acesso

| Requisito | Critérios de aceite |
| --- | --- |
| RF-01 e RF-02 | CA-01: dados válidos criam a conta e o endereço inicial; CA-02: confirmação de senha divergente é rejeitada; CA-03: CPF/CNPJ, e-mail e demais identificadores únicos não podem gerar contas duplicadas; CA-04: entradas inválidas retornam mensagem controlada. |
| RF-03 | CA-05: credencial válida cria sessão; CA-06: senha incorreta não autentica; CA-07: senha excessivamente longa é rejeitada; CA-08: o sistema não informa detalhes que facilitem enumeração indevida de contas. |
| RF-04 e RF-05 | CA-09: sessão íntegra identifica usuário e papel; CA-10: token adulterado ou malformado é rejeitado; CA-11: logout revoga a sessão no navegador. |
| RF-06 | CA-12: solicitação válida cria token temporário sem revelar se a conta existe; CA-13: token válido permite definir senha compatível com a política; CA-14: serviço não configurado informa indisponibilidade controlada. |
| RF-07 | CA-15: estado OAuth íntegro e não expirado é exigido; CA-16: configuração ausente não quebra o login convencional; CA-17: vínculo não pode ser atribuído a conta diferente da sessão solicitante. |

### 4.2 Perfil, endereços e dispositivos

| Requisito | Critérios de aceite |
| --- | --- |
| RF-09 e RF-10 | CA-18: cliente consulta apenas o próprio perfil; CA-19: campos privilegiados ou desconhecidos são rejeitados/ignorados conforme a política; CA-20: atualização válida permanece disponível em nova consulta. |
| RF-11 a RF-13 | CA-21: cliente acessa apenas os próprios endereços; CA-22: endereço válido é normalizado e persistido; CA-23: não é permitido excluir o endereço principal; CA-24: o cliente não pode ficar sem endereço; CA-25: definir novo principal remove a condição do anterior. |
| RF-14 a RF-18 | CA-26: cliente acessa apenas dispositivos próprios; CA-27: cadastro inválido de catálogo é rejeitado; CA-28: atualização válida é persistida; CA-29: exclusão não atinge dispositivo de terceiro; CA-30: formato de foto não permitido é rejeitado. |

### 4.3 Descoberta

| Requisito | Critérios de aceite |
| --- | --- |
| RF-19 e RF-20 | CA-31: a busca recebe exatamente uma origem; CA-32: coordenadas ficam nos limites geográficos; CA-33: somente raios previstos são aceitos; CA-34: geocodificação sem resultado não inventa coordenadas. |
| RF-21 a RF-23 | CA-35: parceiro não aprovado não aparece; CA-36: resultado fora do raio não aparece; CA-37: dados de endereço de outro cliente não são expostos; CA-38: resultados são ordenados por distância; CA-39: serviços inativos não devem ser promovidos como disponíveis. |

### 4.4 Ordens de serviço

| Requisito | Critérios de aceite |
| --- | --- |
| RF-24 a RF-26 | CA-40: solicitação só usa dispositivo do cliente; CA-41: parceiro deve existir e estar elegível; CA-42: problema possui entre 10 e 3000 caracteres; CA-43: sintomas e checklist aceitam apenas opções previstas; CA-44: rascunho inválido é descartado. |
| RF-27 e RF-28 | CA-45: cliente vê apenas suas ordens; CA-46: parceiro vê apenas ordens da própria assistência; CA-47: busca e filtros não alteram os dados; CA-48: histórico é exibido em ordem compreensível. |
| RF-29 | CA-49: somente parceiro vinculado pode orçar; CA-50: ordem deve estar pendente ou cotada; CA-51: diagnóstico possui tamanho permitido; CA-52: orçamento contém de 1 a 30 itens; CA-53: quantidade e preço respeitam limites. |
| RF-30 e RF-31 | CA-54: somente cliente proprietário decide; CA-55: aprovação só ocorre em `quoted`; CA-56: cancelamento só ocorre em `pending` ou `quoted`; CA-57: transição inválida retorna conflito sem modificar a ordem. |
| RF-32 e RF-33 | CA-58: parceiro segue transições permitidas; CA-59: cada mudança efetiva adiciona entrada ao histórico; CA-60: tentativa de outro usuário não altera a ordem. |

### 4.5 Avaliações, notificações e suporte

| Requisito | Critérios de aceite |
| --- | --- |
| RF-34 | CA-61: somente cliente da ordem concluída avalia; CA-62: nota fica entre 1 e 5; CA-63: comentário respeita limite; CA-64: uma ordem aceita no máximo uma avaliação. |
| RF-35 | CA-65: usuário consulta apenas notificações próprias; CA-66: notificação autorizada pode ser marcada como lida; CA-67: identificador alheio não altera dados. |
| RF-37 e RF-38 | CA-68: mensagem vazia ou acima do limite é rejeitada; CA-69: cliente só conversa com parceiro associado a pelo menos uma ordem; CA-70: parceiro só acessa conversa de cliente atendido; CA-71: administrador exige autorização explícita; CA-72: mensagens ficam ordenadas e vinculadas ao destinatário correto. |

### 4.6 Parceiro e administração

| Requisito | Critérios de aceite |
| --- | --- |
| RF-39 a RF-42 | CA-73: dashboard calcula apenas dados do parceiro; CA-74: estado vazio não apresenta métricas fictícias; CA-75: parceiro administra apenas serviços próprios; CA-76: preço e prazo respeitam limites; CA-77: ordens acionáveis recebem prioridade visual. |
| RF-44 a RF-47 | CA-78: sessão comum não acessa função administrativa; CA-79: alteração de aprovação persiste; CA-80: parceiro aprovado pode participar da descoberta; CA-81: parceiro sem aprovação não participa; CA-82: conversas administrativas não podem ser lidas por usuário não autorizado. |

## 5. Regras de negócio

### 5.1 Contas e autorização

| ID | Regra |
| --- | --- |
| RN-01 | Uma conta se identifica como cliente ou parceiro; administrador é uma autorização adicional definida por configuração. |
| RN-02 | E-mail e documento devem respeitar unicidade na categoria de conta correspondente. |
| RN-03 | Senhas novas devem cumprir a política de tamanho e composição definida pela validação. |
| RN-04 | Senhas persistidas devem utilizar hash bcrypt; compatibilidade com senha legada existe apenas para migração controlada. |
| RN-05 | Toda área protegida deve exigir sessão válida e papel compatível. |
| RN-06 | O usuário não pode atribuir a si mesmo perfil ou campo privilegiado por meio da requisição. |
| RN-07 | Estado OAuth adulterado, malformado ou expirado deve ser rejeitado. |

### 5.2 Endereços e dispositivos

| ID | Regra |
| --- | --- |
| RN-08 | Um endereço pertence exatamente a um cliente ou a um parceiro, nunca simultaneamente aos dois. |
| RN-09 | O cliente deve manter ao menos um endereço. |
| RN-10 | O endereço principal não pode ser removido diretamente. |
| RN-11 | Apenas um endereço do proprietário deve permanecer como principal depois da troca. |
| RN-12 | Um dispositivo pertence a um único cliente. |
| RN-13 | Tipo, fabricante e modelo devem corresponder ao catálogo aceito pela aplicação. |
| RN-14 | Operações de dispositivo exigem correspondência entre identificador do dispositivo e cliente autenticado. |

### 5.3 Parceiros e descoberta

| ID | Regra |
| --- | --- |
| RN-15 | Somente assistência aprovada pelo administrador pode ser apresentada como disponível na busca. |
| RN-16 | A busca deve considerar uma única origem: endereço cadastrado ou coordenada/localidade informada. |
| RN-17 | Assistência sem localização válida não pode receber coordenadas inventadas e deve ser omitida do resultado geográfico. |
| RN-18 | Distâncias são aproximações geográficas e não representam rota viária ou prazo de deslocamento. |
| RN-19 | Serviços pertencem ao parceiro autenticado; preço-base não equivale ao orçamento final. |

### 5.4 Ordens e orçamento

| ID | Regra |
| --- | --- |
| RN-20 | Cada ordem vincula exatamente um cliente, um dispositivo desse cliente e um parceiro. |
| RN-21 | A ordem nasce no estado `pending`. |
| RN-22 | Apenas o parceiro vinculado pode registrar diagnóstico e itens do orçamento. |
| RN-23 | Emitir orçamento altera o estado para `quoted`. |
| RN-24 | Apenas o cliente vinculado pode aprovar o orçamento ou cancelar a solicitação. |
| RN-25 | A aprovação é permitida exclusivamente no estado `quoted`. |
| RN-26 | O cancelamento pelo cliente é permitido somente em `pending` ou `quoted`. |
| RN-27 | O parceiro pode iniciar o reparo somente depois da aprovação. |
| RN-28 | De `approved`, a ordem pode seguir para `in_progress`. |
| RN-29 | De `in_progress`, a ordem pode seguir para `waiting_parts` ou `ready`. |
| RN-30 | De `waiting_parts`, a ordem pode retornar para `in_progress`. |
| RN-31 | De `ready`, a ordem pode seguir para `completed`. |
| RN-32 | Toda mudança efetiva de estado deve ser registrada no histórico. |
| RN-33 | Transição não prevista deve ser rejeitada sem alteração parcial dos dados. |

### 5.5 Avaliações, notificações e mensagens

| ID | Regra |
| --- | --- |
| RN-34 | Somente o cliente da ordem concluída pode avaliar o parceiro responsável. |
| RN-35 | Cada ordem pode originar no máximo uma avaliação. |
| RN-36 | A avaliação deve possuir nota inteira entre 1 e 5. |
| RN-37 | Notificações pertencem ao destinatário e não podem ser alteradas por outro usuário. |
| RN-38 | O cliente pode conversar com a SmartFix e com parceiros vinculados a ao menos uma de suas ordens. |
| RN-39 | O parceiro pode consultar e responder somente clientes vinculados a ordens de sua assistência. |
| RN-40 | Mensagens são textuais, possuem limite de 2000 caracteres e não aceitam corpo vazio. |
| RN-41 | O fluxo atual não oferece anexos nem respostas automáticas. |

## 6. Requisitos não funcionais sustentados pelo projeto

| ID | Categoria | Requisito | Evidência/forma de verificação | Situação |
| --- | --- | --- | --- | --- |
| RNF-01 | Segurança | Senhas persistidas devem utilizar hash bcrypt. | Serviço de senha e testes de segurança. | Implementado |
| RNF-02 | Segurança | Sessões devem ser assinadas e tokens adulterados devem ser rejeitados. | Serviço de sessão e `security-services.test.ts`. | Implementado |
| RNF-03 | Autorização | Toda operação protegida deve verificar identidade, papel e propriedade do recurso. | Middleware, serviços de autorização, controllers e testes de política. | Implementado |
| RNF-04 | Validação | Entradas de API devem ser validadas antes da regra de negócio. | Schemas Zod e testes de validação. | Implementado |
| RNF-05 | Privacidade | O navegador não deve receber acesso direto às tabelas PostgreSQL. | Arquitetura servidor/API e configuração do banco. | Implementado |
| RNF-06 | Banco | Tabelas de aplicação devem manter RLS habilitada e papéis públicos sem acesso direto. | Migrations e comando `db:check`. | Implementado; requer verificação no ambiente |
| RNF-07 | Integridade | Operações relacionadas devem preservar chaves estrangeiras, restrições e consistência transacional. | Schema, constraints e transações Sequelize. | Implementado |
| RNF-08 | Isolamento | Dados de cliente e parceiro devem ser isolados por proprietário. | Consultas filtradas e testes integrados. | Implementado |
| RNF-09 | Confiabilidade | Erros internos e respostas não JSON não devem expor detalhes técnicos ao usuário. | Serviço de resposta e `api-response.test.ts`. | Implementado |
| RNF-10 | Compatibilidade | A interface deve adaptar-se a navegadores em telas móveis e desktop. | CSS responsivo; inspeção visual ainda necessária. | Parcialmente verificado |
| RNF-11 | Manutenibilidade | O projeto deve separar interface, rotas, controllers, serviços, validações, modelos e persistência. | Estrutura do repositório. | Implementado |
| RNF-12 | Qualidade | O código deve passar por testes automatizados, lint e build antes da entrega. | Scripts do `package.json`. | Verificação pendente da Parte de testes |
| RNF-13 | Auditabilidade | Mudanças de estado de ordem devem permanecer em histórico. | Campo `history` e política de ordem. | Implementado |
| RNF-14 | Recuperação | E-mails e OAuth indisponíveis devem falhar de forma controlada sem impedir autenticação por senha. | Controllers e mensagens de indisponibilidade. | Implementado |

## 7. Metas não funcionais ainda não comprovadas

Os itens abaixo não devem ser apresentados como resultados alcançados até que exista medição ou infraestrutura comprovável.

| ID | Meta | Evidência necessária |
| --- | --- | --- |
| META-01 | Carregar telas em até 3 segundos. | Cenário, dispositivo, rede, volume de dados e medição repetível. |
| META-02 | Processar atualizações em tempo real. | Definição de latência e teste; o sistema atual usa requisições e consultas periódicas em alguns fluxos. |
| META-03 | Operar 24 horas por dia, 7 dias por semana. | Ambiente implantado, monitoramento e histórico de disponibilidade. |
| META-04 | Suportar múltiplos usuários sem perda de desempenho. | Teste de carga com metas de concorrência, latência e erro. |
| META-05 | Executar backups periódicos automáticos. | Política e evidência do provedor/ambiente implantado. |
| META-06 | Atender critérios formais de acessibilidade. | Auditoria WCAG, testes automáticos e avaliação manual. |
| META-07 | Garantir expansão sem perda de desempenho. | Arquitetura implantada, teste de escala e capacidade definida. |

## 8. Requisitos futuros

| ID | Requisito futuro | Prioridade | Dependências principais |
| --- | --- | --- | --- |
| RF-F01 | Permitir pagamento integrado por PIX e cartão. | Evolução | Provedor de pagamento, segurança, conciliação e regras financeiras. |
| RF-F02 | Registrar histórico, comprovante, retenção e repasse de pagamento. | Evolução | RF-F01 e modelo financeiro. |
| RF-F03 | Permitir agendamento de coleta e entrega. | Evolução | Parceiro logístico, endereços, janelas de horário e tarifas. |
| RF-F04 | Permitir rastreamento logístico. | Evolução | RF-F03 e integração externa. |
| RF-F05 | Disponibilizar painel visual de atendimento para parceiro. | Importante | APIs de conversa já existentes. |
| RF-F06 | Disponibilizar painel visual de atendimento para administrador. | Importante | APIs administrativas já existentes. |
| RF-F07 | Disponibilizar gestão administrativa completa de usuários. | Evolução | Políticas de acesso, auditoria e proteção de dados. |
| RF-F08 | Permitir moderação administrativa de avaliações. | Evolução | Critérios de moderação e trilha de auditoria. |
| RF-F09 | Disponibilizar relatórios e indicadores administrativos. | Evolução | Modelo analítico, métricas e filtros. |
| RF-F10 | Permitir upload seguro de imagens e documentos do defeito. | Evolução | Armazenamento, antivírus, limites, consentimento e privacidade. |
| RF-F11 | Tornar a aplicação instalável como PWA. | Evolução | Manifesto, service worker, estratégia offline e testes. |

## 9. Matriz de rastreabilidade

### 9.1 Cadastro, sessão e perfil

| Requisitos | Interface | API/serviço | Persistência | Testes existentes |
| --- | --- | --- | --- | --- |
| RF-01, RF-02 | `app/cadastro/page.tsx` | `AuthController.register`, `registerSchema` | `clients`, `partner`, `client_addresses` | `auth.validation`, `registration-address.integration`, `workflow.integration` |
| RF-03 a RF-05 | `app/login/page.tsx`, shells de cliente/parceiro | rotas `auth/login`, `auth/session`, `auth/logout`; serviços de senha e sessão | conta e controle de sessão | `auth.validation`, `security-services`, `workflow.integration` |
| RF-06 | `PasswordRecovery.tsx` | `RecoveryController`, `email.service` | registro temporário `reset` | `workflow.integration` |
| RF-07 | login e perfil | `GoogleController`, rotas `auth/google` | registro de identidade `google` | `order-policy` (estado OAuth), `workflow.integration` |
| RF-08 | layouts protegidos | middleware e autorização de página | sessão | `workflow.integration` |
| RF-09, RF-10 | `ClientProfilePage.tsx` | `ClientController`, `profileInput` | `clients` | `order-policy`, `workflow.integration` |

### 9.2 Endereços e dispositivos

| Requisitos | Interface | API/serviço | Persistência | Testes existentes |
| --- | --- | --- | --- | --- |
| RF-11 a RF-13 | `AddressManager.tsx` | `AddressController`, política e validação de endereço | `client_addresses` | `address.validation`, `address-policy`, `client-address.model`, `registration-address.integration` |
| RF-14 a RF-18 | `DeviceManager.tsx` | `DeviceController`, `deviceInputSchema` | `devices` | `device.validation`, `client-device.model` |

### 9.3 Descoberta

| Requisitos | Interface | API/serviço | Persistência/integração | Testes existentes |
| --- | --- | --- | --- | --- |
| RF-19 a RF-23 | `AssistanceFinder.tsx`, `AssistanceMap.tsx` | `DiscoveryController`, geocodificação e distância | `partner`, `client_addresses`, `reviews`, `partner_services`; Photon/OSM | `discovery.test.ts` |

### 9.4 Ordens, orçamento e avaliação

| Requisitos | Interface | API/serviço | Persistência | Testes existentes |
| --- | --- | --- | --- | --- |
| RF-24 a RF-26 | `RepairRequest.tsx` | `WorkflowController.create`, `orderInput`, rascunho de reparo | `repair_orders` | `repair-request-draft`, `workflow.integration`, `order-policy` |
| RF-27, RF-28 | `ClientOrders.tsx`, `PartnerOrders.tsx` | `WorkflowController.list` | `repair_orders` | `workflow.integration`, testes de dashboard |
| RF-29 a RF-33 | `PartnerOrders.tsx`, `ClientOrders.tsx` | `WorkflowController.update`, `applyOrderAction` | `repair_orders.history`, `quote`, `diagnosis` | `order-policy`, `workflow.integration` |
| RF-34 | `ClientReviews.tsx`, perfil público da assistência | ação `review`, `DiscoveryController.reviews` | `reviews` | `order-policy`, `workflow.integration` |

### 9.5 Notificações, suporte, parceiro e administração

| Requisitos | Interface | API/serviço | Persistência | Testes existentes |
| --- | --- | --- | --- | --- |
| RF-35 | dashboards e páginas de notificações | `WorkflowController.notifications/readNotification` | registro `notification` | `client-dashboard`, `partner-dashboard`, `workflow.integration` |
| RF-36 a RF-38 | `HelpCenter.tsx` | APIs `support/recipients` e `support/messages` | `support_messages` | Sem teste dedicado identificado; requer caso novo |
| RF-39 | `PartnerDashboard.tsx` | serviço de dashboard do parceiro | ordens e notificações | `partner-dashboard` |
| RF-40, RF-41 | `PartnerServices.tsx` | `ServiceController` | `partner_services` | Sem teste dedicado identificado; requer caso novo |
| RF-42 | `PartnerOrders.tsx` | políticas de ordem | `repair_orders` | `order-policy`, `workflow.integration` |
| RF-43 | Interface pendente | APIs `partners/support/conversations` | `support_messages` | Sem teste dedicado identificado; requer caso novo |
| RF-44 a RF-46 | `app/admin/parceiros/page.tsx` | autorização administrativa e aprovação de parceiro | `partner.is_verified` | `workflow.integration` cobre aprovação; ampliar autorização |
| RF-47 | Interface pendente | APIs `admin/support/conversations` | `support_messages` | Sem teste dedicado identificado; requer caso novo |

## 10. Lacunas de teste identificadas

Para que a futura seção de validação seja consistente, recomenda-se incluir ou executar verificações específicas para:

1. catálogo de serviços do parceiro;
2. envio, leitura e isolamento de mensagens de suporte;
3. APIs administrativas de conversas;
4. autorização administrativa negativa;
5. páginas de termos e privacidade;
6. responsividade das telas principais;
7. acessibilidade por teclado, rótulos e contraste;
8. fluxo configurado de Google OAuth;
9. fluxo configurado de recuperação por e-mail;
10. comando de verificação do banco contra ambiente PostgreSQL real;
11. build de produção e lint;
12. comportamento em erros dos serviços externos de geocodificação e e-mail.

Essas lacunas não significam necessariamente defeitos. Elas indicam ausência de evidência automatizada ou registrada suficiente para uma afirmação acadêmica mais forte.

## 11. Uso na monografia

No corpo do Capítulo 4, os requisitos devem ser apresentados por grupos, acompanhados dos fluxos e das regras mais relevantes. As tabelas completas podem ser movidas para apêndices para preservar a fluidez da leitura.

Os requisitos futuros devem aparecer somente na delimitação do escopo e nos trabalhos futuros. Eles não devem integrar tabelas de resultados alcançados.

Os requisitos não funcionais precisam ser escritos de modo verificável. Expressões como "rápido", "seguro", "em tempo real" e "escalável" devem ser substituídas por propriedades demonstradas ou metas acompanhadas de método de medição.

## 12. Resultado da Parte 3

A versão atual fica representada por:

- 47 requisitos funcionais, incluindo cinco fluxos parciais ou condicionais claramente sinalizados;
- 41 regras de negócio;
- 14 requisitos não funcionais sustentados pelo projeto;
- 7 metas não funcionais ainda não aferidas;
- 11 requisitos futuros;
- critérios de aceite e rastreabilidade até código, banco e testes.

O próximo passo é a Parte 4: atualizar a modelagem. Essa etapa deverá revisar o DER e produzir a especificação dos diagramas de casos de uso, atividades, sequências, estados, domínio, componentes e implantação.
