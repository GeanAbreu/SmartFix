# PARTE 7 - CAPÍTULO 4: ESPECIFICAÇÃO DO SMARTFIX

> **Nota editorial:** este arquivo contém a redação-base do Capítulo 4 da monografia. A numeração de figuras, quadros, tabelas e páginas deverá ser atualizada automaticamente na montagem do documento final. Os catálogos completos de requisitos e regras de negócio serão transferidos para os apêndices.

## 4 ESPECIFICAÇÃO DO SMARTFIX

Este capítulo apresenta a especificação da versão do SmartFix analisada em outubro de 2026. São descritos a finalidade da solução, os perfis que interagem com a plataforma, o escopo efetivamente implementado, os requisitos funcionais e não funcionais e as principais regras que controlam o ciclo de uma ordem de serviço. A separação entre funcionalidades disponíveis, recursos condicionais e evoluções futuras é necessária para que a documentação represente o estado real do projeto.

O levantamento foi elaborado a partir da análise do código-fonte, das rotas da aplicação, dos modelos de persistência, das migrations do banco de dados, dos testes automatizados e da execução dos procedimentos de validação. Dessa forma, uma funcionalidade somente foi classificada como implementada quando foram identificadas evidências correspondentes na interface, na camada de servidor ou na persistência.

### 4.1 Visão geral da solução

O SmartFix é uma plataforma web responsiva voltada à organização do relacionamento entre clientes e assistências técnicas durante o reparo de dispositivos eletrônicos. A solução concentra informações que, em processos convencionais, podem permanecer distribuídas entre mensagens, chamadas telefônicas, anotações e sistemas distintos. Entre essas informações estão os dados do dispositivo, a descrição inicial do defeito, a assistência escolhida, o diagnóstico, os itens do orçamento, a decisão do cliente e o histórico de evolução do serviço.

O processo tem início com a criação de uma conta. O cliente mantém endereços e dispositivos, localiza assistências aprovadas e registra uma solicitação de reparo. A assistência vinculada analisa a demanda e informa o diagnóstico e o orçamento detalhado. O cliente pode aprovar a proposta ou cancelar a solicitação enquanto ela ainda não foi aprovada. Depois da aprovação, a assistência atualiza o reparo pelas etapas técnicas permitidas, até que o equipamento esteja pronto e a ordem seja concluída. Ao final, o cliente pode avaliar a assistência.

Além do fluxo da ordem de serviço, a plataforma oferece notificações, consulta de avaliações, catálogo de serviços dos parceiros e atendimento por mensagens. As operações são separadas de acordo com o perfil autenticado e com a propriedade de cada recurso. Assim, um cliente não deve consultar dados de outro cliente, e uma assistência não deve acessar ordens destinadas a outro parceiro.

O SmartFix atual utiliza uma arquitetura web baseada em Next.js, React e TypeScript. O navegador acessa páginas e endpoints da própria aplicação, enquanto as operações de banco são executadas pelo servidor. Os dados são armazenados em PostgreSQL por meio do Sequelize. A validação das entradas utiliza Zod, e o controle de acesso combina sessões assinadas, papéis, propriedade dos recursos e restrições relacionais.

### 4.2 Perfis de usuário

A versão analisada possui três contextos de acesso: cliente, assistência técnica parceira e administrador. Serviços externos, como geocodificação, autenticação Google e envio de e-mail, participam de operações específicas, mas não constituem perfis operacionais do SmartFix.

#### 4.2.1 Cliente

O cliente é a pessoa que utiliza a plataforma para localizar uma assistência e acompanhar o reparo de um dispositivo. Depois da autenticação, pode manter seus dados pessoais autorizados, cadastrar endereços, registrar dispositivos, buscar assistências, consultar serviços e avaliações, abrir solicitações, analisar orçamentos, acompanhar ordens, receber notificações, conversar com o suporte e avaliar serviços concluídos.

O cliente somente pode manipular recursos pertencentes à própria conta. Esse isolamento é aplicado nas consultas e nas operações de atualização. A identificação do proprietário é obtida da sessão autenticada, e não de um campo livre enviado pela interface.

#### 4.2.2 Assistência técnica parceira

A assistência técnica é representada por uma conta de parceiro. Após o cadastro, o parceiro deve ser aprovado pela administração para aparecer na busca dos clientes. O parceiro aprovado pode manter um catálogo de serviços com descrição, preço-base e prazo estimado.

No fluxo de reparo, a assistência consulta somente as ordens vinculadas à própria conta. Para cada ordem elegível, pode registrar diagnóstico, elaborar orçamento e atualizar o estado técnico conforme as transições autorizadas. O parceiro também possui dashboard e notificações. A infraestrutura de mensagens para atendimento do cliente está disponível por APIs, embora a interface visual completa desse atendimento ainda seja uma evolução prevista.

#### 4.2.3 Administrador

O acesso administrativo é concedido a contas cujos identificadores estão explicitamente configurados no ambiente da aplicação. Não existe cadastro público de administrador. Na versão analisada, a função administrativa implementada concentra-se na consulta e aprovação de parceiros.

Também existem endpoints protegidos para listar conversas destinadas à SmartFix, ler mensagens e responder clientes. Entretanto, não foi identificada uma interface administrativa completa para esse atendimento. Gestão integral de usuários, moderação de avaliações e relatórios analíticos permanecem fora do conjunto entregue.

### 4.3 Escopo da versão atual

O escopo implementado abrange as funcionalidades necessárias para demonstrar o ciclo principal de relacionamento entre cliente e assistência. O Quadro 1 sintetiza esse escopo.

**Quadro 1 - Escopo funcional implementado**

| Área | Funcionalidades |
| --- | --- |
| Acesso | Cadastro de cliente e parceiro, login, logout e sessão assinada. |
| Conta | Consulta e atualização de perfil do cliente. |
| Endereços | Cadastro, edição, exclusão controlada e definição do endereço principal. |
| Dispositivos | Cadastro, edição, exclusão e registro de informações iniciais do defeito. |
| Descoberta | Busca de assistências aprovadas por origem e raio, mapa, serviços e avaliações. |
| Solicitação | Escolha de dispositivo e parceiro, descrição do problema, sintomas e checklist. |
| Ordem de serviço | Diagnóstico, orçamento, aprovação, cancelamento, histórico e atualização técnica. |
| Relacionamento | Notificações, central de ajuda, mensagens e avaliações. |
| Parceiro | Dashboard, catálogo de serviços e gestão das ordens vinculadas. |
| Administração | Listagem e aprovação de assistências técnicas. |

Fonte: Elaborado pelos autores (2026).

O login pelo Google e a recuperação de senha por e-mail possuem implementação, mas dependem da configuração de serviços externos. Por esse motivo, são classificados como recursos condicionais. A exibição de foto de dispositivo utiliza uma referência válida de imagem, porém não foi identificado um fluxo completo de upload e armazenamento de mídia enviado pelo usuário.

#### 4.3.1 Delimitação do escopo

O sistema não executa o reparo dos dispositivos. A atividade técnica é responsabilidade das assistências parceiras. A plataforma organiza informações e interações associadas ao serviço.

Pagamento integrado, coleta, entrega e rastreamento logístico não fazem parte do fluxo implementado. Esses recursos apareciam em versões anteriores do planejamento, mas não possuem modelos, endpoints e interfaces produtivas correspondentes na versão analisada. Também não foram considerados entregues a gestão administrativa completa de usuários, a moderação de avaliações, os relatórios gerais e a instalação como Progressive Web App.

Essa delimitação evita que objetivos futuros sejam confundidos com resultados alcançados. O Quadro 2 apresenta a classificação dos principais recursos que permanecem em evolução.

**Quadro 2 - Funcionalidades previstas para evolução**

| Funcionalidade | Situação na versão analisada |
| --- | --- |
| Pagamento por PIX ou cartão | Não implementado no fluxo produtivo. |
| Histórico e comprovante de pagamento | Dependente do futuro módulo financeiro. |
| Agendamento de coleta e entrega | Não implementado. |
| Rastreamento logístico | Não implementado. |
| Painel visual de atendimento do parceiro | APIs disponíveis; interface pendente. |
| Painel visual de atendimento administrativo | APIs disponíveis; interface pendente. |
| Gestão administrativa completa de usuários | Planejada. |
| Moderação de avaliações | Planejada. |
| Relatórios administrativos | Planejados. |
| Upload de imagens e documentos | Fluxo completo pendente. |
| Instalação como PWA | Não confirmada na versão atual. |

Fonte: Elaborado pelos autores (2026).

### 4.4 Requisitos funcionais

Os requisitos funcionais descrevem os serviços e comportamentos que a plataforma oferece aos seus usuários. O catálogo completo possui 47 requisitos e será apresentado em apêndice. Para facilitar a leitura, esta seção organiza os requisitos em grupos funcionais.

#### 4.4.1 Cadastro, autenticação e conta

O primeiro grupo compreende os requisitos RF-01 a RF-10. O sistema permite o cadastro de clientes e parceiros, aplicando validações de documento, contato, endereço e senha. Após uma autenticação válida, uma sessão assinada identifica a conta e seu papel. O usuário pode consultar a sessão e encerrá-la por meio do logout.

A recuperação de senha utiliza token temporário e envio de e-mail quando o provedor está configurado. De forma semelhante, o Google OAuth pode ser utilizado para autenticação ou vinculação de identidade. A ausência dessas configurações não impede o acesso convencional por senha e produz uma mensagem controlada de indisponibilidade.

O cliente autenticado pode consultar o próprio perfil e alterar campos pessoais autorizados. Campos privilegiados, desconhecidos ou associados ao controle de papel não podem ser definidos livremente pela requisição.

#### 4.4.2 Endereços e dispositivos

Os requisitos RF-11 a RF-18 tratam dos dados necessários à identificação do cliente e de seus equipamentos. O cliente pode manter mais de um endereço e selecionar um deles como principal. Para proteger a consistência do cadastro, o endereço principal não pode ser removido diretamente e a conta não pode ficar sem endereço.

Os dispositivos são cadastrados em uma área própria. Cada registro pertence a um cliente e contém tipo, fabricante, modelo e informações complementares, como apelido, número de série, referência de foto e descrição inicial do defeito. A aplicação valida combinações admitidas de tipo, fabricante e modelo, reduzindo cadastros inconsistentes.

#### 4.4.3 Descoberta de assistências

Os requisitos RF-19 a RF-23 descrevem a busca de assistências por proximidade. O cliente pode selecionar um endereço cadastrado, informar uma localidade ou utilizar coordenadas válidas. Também escolhe um raio entre os valores aceitos pela aplicação.

A camada de servidor consulta somente parceiros aprovados e tenta localizar o endereço de cada assistência. Os parceiros sem coordenadas válidas não recebem posições artificiais e são omitidos do resultado geográfico. Para os demais, a distância aproximada é calculada e utilizada para filtrar e ordenar a lista.

A distância apresentada é geográfica e não corresponde a uma rota viária. Depois de selecionar uma assistência, o cliente pode consultar seus serviços ativos, preços-base e avaliações. O preço do catálogo funciona como referência e não substitui o orçamento final elaborado para uma ordem específica.

#### 4.4.4 Solicitação e triagem do reparo

Os requisitos RF-24 a RF-26 definem a criação da solicitação. O cliente seleciona um dispositivo próprio e uma assistência elegível, descreve o problema e pode informar sintomas e condições observadas no equipamento. O checklist registra aspectos como funcionamento inicial, marcas ou acessórios entregues.

Antes do envio, um rascunho válido pode ser preservado durante a navegação entre telas relacionadas. Conteúdo incompatível ou pertencente a outra seleção é descartado ou ajustado. Quando a solicitação é confirmada, o sistema cria a ordem no estado `pending`, correspondente a “Aguardando diagnóstico”.

#### 4.4.5 Diagnóstico, orçamento e acompanhamento

Os requisitos RF-27 a RF-33 constituem o núcleo do SmartFix. Cliente e parceiro podem listar as ordens que lhes pertencem, mas possuem permissões distintas. O parceiro registra diagnóstico e orçamento detalhado para ordens pendentes ou já cotadas. O orçamento possui itens, quantidades e valores unitários, permitindo calcular o total apresentado ao cliente.

Depois da emissão, a ordem passa ao estado `quoted`, correspondente a “Aguardando aprovação”. Somente o cliente proprietário pode aprovar ou cancelar a solicitação. A aprovação é aceita apenas no estado `quoted`, enquanto o cancelamento é permitido nos estados `pending` e `quoted`.

Após a aprovação, o parceiro pode iniciar o reparo e avançar pelas etapas técnicas autorizadas. Cada mudança efetiva de estado é adicionada ao histórico da ordem. Transições incompatíveis são rejeitadas sem modificar parcialmente o registro.

#### 4.4.6 Avaliações, notificações e suporte

Os requisitos RF-34 a RF-38 abrangem as interações complementares. Depois que uma ordem é concluída, seu cliente pode registrar uma avaliação de uma a cinco estrelas, com comentário opcional. Cada ordem aceita no máximo uma avaliação, e cliente e parceiro devem coincidir com os participantes da ordem.

As notificações são vinculadas ao destinatário e podem ser consultadas nas áreas de cliente e parceiro. A marcação de leitura também exige que a notificação pertença ao usuário autenticado.

A central de ajuda reúne perguntas frequentes e conversas. O cliente pode conversar com a equipe SmartFix ou com uma assistência ligada a pelo menos uma de suas ordens. As mensagens são textuais, possuem limite de tamanho e permanecem vinculadas ao destinatário correto. Anexos e respostas automáticas não fazem parte do fluxo atual.

#### 4.4.7 Operações do parceiro

Os requisitos RF-39 a RF-43 detalham as funções próprias da assistência. O dashboard do parceiro apresenta notificações e prioriza ordens com ações disponíveis. O catálogo permite cadastrar e editar serviços, informando nome, descrição, preço-base, prazo estimado e situação.

O parceiro acessa exclusivamente ordens associadas à sua conta. A mesma restrição é aplicada às APIs de atendimento: somente clientes que possuam uma ordem com a assistência podem formar uma conversa elegível. A ausência de uma interface visual completa para essas conversas caracteriza o requisito como parcialmente implementado.

#### 4.4.8 Operações administrativas

Os requisitos RF-44 a RF-47 abrangem as funções administrativas atuais. O sistema restringe essas ações às contas configuradas como administradoras. A principal interface permite listar parceiros e alterar sua aprovação. Essa condição afeta diretamente a participação da assistência na busca geográfica.

As APIs administrativas de suporte permitem listar conversas destinadas à SmartFix, consultar mensagens e responder. Como a interface visual completa ainda não está presente, esse conjunto também é classificado como parcial.

### 4.5 Requisitos não funcionais

Os requisitos não funcionais descrevem propriedades de segurança, integridade, privacidade, confiabilidade e manutenibilidade. Para evitar afirmações sem evidência, foram separados os requisitos sustentados pela implementação das metas que ainda dependem de medição.

**Quadro 3 - Requisitos não funcionais sustentados**

| ID | Categoria | Requisito resumido |
| --- | --- | --- |
| RNF-01 | Segurança | Armazenar senhas com hash bcrypt. |
| RNF-02 | Segurança | Assinar sessões e rejeitar tokens adulterados. |
| RNF-03 | Autorização | Verificar identidade, papel e propriedade. |
| RNF-04 | Validação | Validar entradas antes da regra de negócio. |
| RNF-05 | Privacidade | Impedir acesso direto do navegador às tabelas. |
| RNF-06 | Banco de dados | Manter RLS habilitada e bloquear papéis públicos. |
| RNF-07 | Integridade | Preservar restrições, relacionamentos e transações. |
| RNF-08 | Isolamento | Separar dados por cliente e parceiro. |
| RNF-09 | Confiabilidade | Tratar respostas e erros sem expor detalhes internos. |
| RNF-10 | Compatibilidade | Adaptar a interface a telas móveis e desktop. |
| RNF-11 | Manutenibilidade | Separar responsabilidades em camadas. |
| RNF-12 | Qualidade | Executar testes, lint e build antes da entrega. |
| RNF-13 | Auditabilidade | Preservar histórico de mudanças das ordens. |
| RNF-14 | Recuperação | Tratar indisponibilidade de integrações opcionais. |

Fonte: Elaborado pelos autores (2026).

A validação técnica confirmou 42 testes automatizados aprovados, análise estática sem diagnósticos, build de produção concluído e compatibilidade do schema PostgreSQL. A verificação do banco constatou Row Level Security ativa nas nove tabelas avaliadas e bloqueio de acesso direto pelos papéis públicos. Um smoke test transacional também verificou operações CRUD, propriedade, chaves estrangeiras, cascatas, orçamento e unicidade de avaliação.

Essas evidências sustentam os requisitos dentro do escopo testado, mas não permitem generalizações ilimitadas. Por exemplo, responsividade ainda exige inspeção visual, e manutenibilidade não pode ser medida apenas pela organização das pastas.

#### 4.5.1 Metas ainda não aferidas

Alguns requisitos presentes na documentação anterior foram reclassificados como metas porque não possuem medição suficiente. Entre eles estão carregamento em até três segundos, operação contínua 24 horas por dia, atualizações em tempo real, suporte a carga concorrente, backups automáticos, conformidade formal com critérios de acessibilidade e expansão sem perda de desempenho.

Para que essas metas sejam apresentadas como atendidas, será necessário definir ambiente, volume de dados, número de usuários, critérios de aceitação, ferramentas de medição e repetição dos testes. Até que isso ocorra, não devem compor a lista de resultados alcançados.

### 4.6 Regras de negócio

As regras de negócio controlam a propriedade dos dados e as ações permitidas em cada etapa. O catálogo completo contém 41 regras. O Quadro 4 apresenta as mais relevantes ao fluxo principal.

**Quadro 4 - Regras de negócio do SmartFix**

| Grupo | Regras principais |
| --- | --- |
| Conta | A conta é cliente ou parceiro; administrador é autorização adicional. Sessões inválidas ou papéis incompatíveis são rejeitados. |
| Endereço | Um endereço pertence a cliente ou parceiro, nunca simultaneamente aos dois. O cliente deve manter um endereço e apenas um principal. |
| Dispositivo | Cada dispositivo pertence a um único cliente e somente seu proprietário pode alterá-lo. |
| Parceiro | Apenas assistência aprovada participa da busca. Serviços pertencem ao parceiro autenticado. |
| Ordem | A ordem vincula cliente, dispositivo do cliente e parceiro. Somente os participantes autorizados podem consultá-la ou alterá-la. |
| Orçamento | Somente o parceiro vinculado diagnostica e orça; somente o cliente vinculado aprova ou cancela. |
| Estado | As transições seguem uma máquina de estados e cada mudança é registrada no histórico. |
| Avaliação | Somente ordem concluída pode ser avaliada e cada ordem aceita uma avaliação. |
| Mensagem | Conversas exigem vínculo elegível; mensagem é textual, não vazia e limitada a 2000 caracteres. |

Fonte: Elaborado pelos autores (2026).

#### 4.6.1 Ciclo da ordem de serviço

A ordem de serviço utiliza oito estados canônicos. O estado inicial é `pending`. Quando a assistência envia o diagnóstico e o orçamento, a ordem passa para `quoted`. A aprovação do cliente produz `approved`, enquanto o cancelamento permitido produz `cancelled`.

Uma ordem aprovada pode ser iniciada pelo parceiro e assumir `in_progress`. Durante o reparo, pode ser necessário aguardar peças, produzindo `waiting_parts`, com possibilidade de retorno a `in_progress`. Quando o reparo termina, o parceiro registra `ready`. A conclusão ocorre pela transição de `ready` para `completed`.

**Figura X - Estados da ordem de serviço do SmartFix**

> Inserir o diagrama de estados produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

Não existe transição direta de `approved` para `completed`. Também não há estado de pagamento, coleta ou entrega na máquina atual. A avaliação não altera o estado da ordem; ela é um registro vinculado a uma ordem já concluída.

### 4.7 Casos de uso e fluxo principal

Os casos de uso organizam as funcionalidades conforme os três atores. O cliente concentra cadastro de dados, descoberta, solicitação, decisão e acompanhamento. A assistência técnica concentra catálogo, diagnóstico, orçamento e execução das etapas. O administrador controla a aprovação dos parceiros e possui acesso protegido ao atendimento dirigido à SmartFix.

**Figura X - Casos de uso da plataforma SmartFix**

> Inserir o diagrama de casos de uso produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

O fluxo principal começa com a autenticação e a preparação dos dados do cliente. Em seguida, o usuário seleciona uma assistência aprovada, escolhe um dispositivo e descreve o defeito. A solicitação permanece aguardando diagnóstico até que o parceiro emita o orçamento. A decisão do cliente determina o cancelamento ou o prosseguimento para as etapas técnicas. Depois da conclusão, torna-se possível registrar a avaliação.

**Figura X - Atividades do fluxo principal de reparo**

> Inserir o diagrama de atividades produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

### 4.8 Rastreabilidade

A rastreabilidade relaciona requisito, interface, endpoint, persistência e teste. Essa relação reduz divergências entre a documentação e o produto porque permite identificar a evidência correspondente a cada comportamento declarado.

O Quadro 5 apresenta uma síntese dos principais grupos. A matriz completa será incluída em apêndice.

**Quadro 5 - Síntese da rastreabilidade dos requisitos**

| Grupo de requisitos | Interface principal | Camada de servidor | Persistência | Evidência de teste |
| --- | --- | --- | --- | --- |
| RF-01 a RF-10 | Cadastro, login, recuperação e perfil | Controllers de autenticação, recuperação, Google e cliente | `clients`, `partner`, endereços e registros auxiliares | Validação de autenticação, segurança e integração do workflow |
| RF-11 a RF-13 | Gerenciador de endereços | Controller e política de endereço | `client_addresses` | Validação, política e model |
| RF-14 a RF-18 | Gerenciador de dispositivos | Controller e validação de dispositivo | `devices` | Validação e model |
| RF-19 a RF-23 | Busca e mapa | Controller de descoberta, geocodificação e distância | Parceiros, endereços, serviços e avaliações | Testes de descoberta |
| RF-24 a RF-33 | Solicitação e ordens | Controller de workflow e política da ordem | `repair_orders` | Rascunho, política e workflow integrado |
| RF-34 | Avaliações | Ação de avaliação e consulta pública | `reviews` | Política e workflow integrado |
| RF-35 | Notificações | Consulta e marcação de leitura | Registros auxiliares | Dashboards e workflow integrado |
| RF-36 a RF-38 | Central de ajuda | APIs de destinatários e mensagens | `support_messages` | Teste dedicado ainda recomendado |
| RF-39 a RF-43 | Área do parceiro | Dashboard, serviços, ordens e suporte | Ordens, serviços e mensagens | Dashboard e políticas; ampliar suporte |
| RF-44 a RF-47 | Administração | Autorização e APIs administrativas | Parceiros e mensagens | Aprovação coberta; ampliar autorização e conversas |

Fonte: Elaborado pelos autores (2026).

A matriz também evidencia as áreas que ainda necessitam de testes específicos, principalmente o catálogo de serviços, as conversas de suporte, a autorização administrativa negativa e a responsividade. Essas lacunas não significam que as funcionalidades estejam necessariamente incorretas, mas limitam a força das conclusões que podem ser apresentadas.

### 4.9 Síntese do capítulo

A especificação demonstra que a versão atual do SmartFix possui um fluxo funcional de reparo centrado na interação entre cliente e assistência técnica. O sistema implementa cadastro, autenticação, organização de endereços e dispositivos, descoberta geográfica, solicitação, diagnóstico, orçamento, aprovação, acompanhamento, notificações, mensagens e avaliações.

A análise também delimita recursos que ainda não fazem parte da entrega, como pagamento, logística e relatórios administrativos. Essa separação orienta os capítulos seguintes, nos quais serão apresentados a modelagem, a arquitetura e os detalhes da implementação. O capítulo de resultados retomará os requisitos e as evidências de validação para discutir o grau de atendimento dos objetivos do trabalho.
