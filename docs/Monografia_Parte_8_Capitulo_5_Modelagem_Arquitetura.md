# PARTE 8 - CAPÍTULO 5: MODELAGEM E ARQUITETURA

> **Nota editorial:** este arquivo contém a redação-base do Capítulo 5. Os números definitivos de figuras, quadros e páginas serão atribuídos na montagem do documento final. Os diagramas indicados foram definidos na Parte 4 e deverão ser exportados em formato vetorial.

## 5 MODELAGEM E ARQUITETURA

Este capítulo apresenta a modelagem e a arquitetura da versão atual do SmartFix. Os modelos foram elaborados a partir dos requisitos e das regras de negócio consolidados, buscando representar o funcionamento efetivamente implementado. A análise contempla a organização lógica da aplicação, os fluxos entre atores, o ciclo da ordem de serviço, as entidades do domínio, os componentes de software, o ambiente de implantação e a estrutura relacional do banco de dados.

A atualização desses modelos foi necessária porque os diagramas anteriores representavam um aplicativo móvel com pagamento e logística integrados. A implementação analisada, entretanto, corresponde a uma plataforma web responsiva, composta por páginas e APIs do Next.js, persistência PostgreSQL e integrações externas opcionais. Assim, foram removidos dos modelos os atores e componentes que não pertencem à versão entregue, como entregador, gateway financeiro, coleta, entrega e armazenamento de mídia não implementado.

### 5.1 Visão arquitetural

O SmartFix adota uma arquitetura web organizada em camadas dentro de um único projeto Next.js. Essa organização não caracteriza um conjunto de microserviços independentes. As páginas, APIs e regras de negócio fazem parte da mesma aplicação, embora estejam separadas em módulos com responsabilidades distintas.

O navegador constitui o ponto de interação com o usuário. A interface é construída com React e TypeScript e utiliza o App Router do Next.js para navegação, renderização e definição das rotas. As ações que exigem dados persistidos são enviadas aos Route Handlers da aplicação por meio de requisições HTTP.

Os Route Handlers delegam o processamento aos controllers. Esses componentes interpretam a requisição, acionam validações e serviços, e transformam o resultado em uma resposta HTTP controlada. As regras de negócio permanecem concentradas em serviços e políticas, evitando que decisões importantes dependam apenas da interface.

A persistência utiliza models do Sequelize e, no caso das ordens, um repository responsável por traduzir o contrato utilizado pelo domínio para as tabelas relacionais. O PostgreSQL mantém dados operacionais, restrições, relacionamentos, controle de migrations e Row Level Security. O navegador não recebe credenciais de banco e não consulta diretamente suas tabelas.

Integrações externas participam de funções específicas. Photon e OpenStreetMap apoiam a localização geográfica; Google OAuth pode complementar a autenticação; e Resend pode fornecer o envio de mensagens de recuperação de senha. A indisponibilidade dessas integrações opcionais deve ser tratada sem comprometer o login convencional e os fluxos que não dependem delas.

**Figura X - Arquitetura de componentes do SmartFix**

> Inserir o diagrama de componentes produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

O Quadro 6 resume as responsabilidades arquiteturais.

**Quadro 6 - Responsabilidades das camadas da aplicação**

| Camada | Responsabilidade principal |
| --- | --- |
| Interface | Apresentar dados, coletar entradas e orientar a navegação. |
| App Router | Resolver páginas e endpoints da aplicação. |
| Route Handlers | Receber requisições HTTP e expor as operações do servidor. |
| Controllers | Orquestrar validação, autorização, serviços e respostas. |
| Serviços e políticas | Implementar regras de domínio, autenticação, autorização e integrações. |
| Validações | Normalizar dados e rejeitar entradas incompatíveis. |
| Models e repository | Mapear entidades e operações para a persistência relacional. |
| PostgreSQL | Preservar dados, relacionamentos, restrições, histórico e migrations. |

Fonte: Elaborado pelos autores (2026).

### 5.2 Casos de uso

O modelo de casos de uso identifica três atores operacionais. O cliente é responsável pela preparação e pelo acompanhamento da solicitação. A assistência técnica executa as operações relacionadas ao diagnóstico, ao orçamento e ao reparo. O administrador controla o credenciamento dos parceiros e possui acesso protegido aos atendimentos direcionados à SmartFix.

Para o cliente, os casos de uso compreendem gerenciamento de conta e sessão, endereços, dispositivos, descoberta de assistências, solicitação de reparo, consulta de ordens, decisão sobre orçamento, notificações, mensagens e avaliações. A relação entre esses casos representa uma jornada na qual os dados cadastrados previamente são reutilizados em novas solicitações.

Para o parceiro, os casos de uso incluem manutenção do catálogo, consulta de ordens vinculadas, diagnóstico, orçamento, atualização do estado e notificações. O parceiro não pode consultar ordens pertencentes a outra assistência, mesmo quando conhece o identificador do registro.

O administrador possui escopo menor na versão atual. Pode listar e aprovar parceiros e utilizar APIs protegidas de atendimento. Casos como relatórios gerais, moderação de avaliações e gestão completa de usuários não foram inseridos no modelo porque permanecem planejados.

O diagrama de casos de uso é apresentado no Capítulo 4, junto da especificação dos atores e requisitos. Sua leitura em conjunto com a matriz de rastreabilidade permite relacionar cada capacidade às interfaces e aos componentes que a implementam.

### 5.3 Diagrama de atividades

O diagrama de atividades representa o fluxo principal do reparo. O processo inicia com a autenticação do cliente. Caso os dados necessários ainda não estejam disponíveis, o usuário mantém endereço e dispositivo. Em seguida, realiza a busca de assistências e seleciona um parceiro aprovado.

Na solicitação, o cliente escolhe o equipamento e descreve o problema. Sintomas e itens de checklist complementam a triagem inicial. Depois do envio, a ordem permanece aguardando diagnóstico. A assistência técnica registra o diagnóstico e os itens do orçamento, transferindo ao cliente a decisão de continuidade.

Uma recusa antes da aprovação encerra a ordem como cancelada. A aprovação permite que o parceiro inicie o reparo. Durante a execução, a ordem pode entrar em espera por peças e retornar posteriormente ao reparo. Quando o serviço técnico termina, o equipamento é marcado como pronto para retirada. A conclusão habilita a avaliação do parceiro.

A atividade não inclui pagamento ou transporte, pois essas etapas não estão conectadas ao workflow atual. Da mesma forma, não existe uma etapa de aceite inicial do pedido pelo parceiro. Sua primeira ação prevista sobre a ordem é produzir diagnóstico e orçamento.

### 5.4 Diagramas de sequência

Os diagramas de sequência detalham a ordem cronológica das interações entre usuários e componentes. Em vez de um único modelo extenso, foram definidos quatro fluxos: cadastro, descoberta geográfica, emissão de orçamento e evolução técnica da ordem.

#### 5.4.1 Cadastro e autenticação

No cadastro, a interface envia os dados à API de autenticação. O servidor aplica o schema de validação, normaliza os valores e rejeita entradas inválidas antes de iniciar a persistência. Para uma entrada válida, o serviço de senha produz o hash bcrypt e a camada de dados cria a conta e seu endereço inicial. A sessão assinada é gerada somente após a conclusão da operação.

Essa sequência impede que a segurança dependa do navegador. Mesmo que um usuário altere o formulário ou envie uma requisição diretamente, a camada de servidor continua responsável por validar dados, proteger a senha e atribuir o papel permitido.

**Figura X - Sequência de cadastro e autenticação por senha**

> Inserir o diagrama de sequência de cadastro produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

#### 5.4.2 Descoberta geográfica

A busca de assistências exige uma sessão de cliente e uma origem. Quando a origem corresponde a um endereço cadastrado, a API consulta o registro utilizando simultaneamente o identificador do endereço e o identificador da conta autenticada. Esse filtro evita que o cliente utilize o endereço privado de outra conta.

Depois da localização da origem, o servidor consulta parceiros aprovados e seus endereços. Cada localização válida é convertida em coordenadas. A aplicação calcula a distância geográfica, aplica o raio selecionado e ordena os resultados. Parceiros sem localização válida são contabilizados como indisponíveis, mas não recebem coordenadas inventadas.

**Figura X - Sequência da descoberta geográfica de assistências**

> Inserir o diagrama de sequência de descoberta produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

#### 5.4.3 Solicitação, diagnóstico e orçamento

A criação da ordem começa com a seleção de um dispositivo e de uma assistência. A API confirma que o dispositivo pertence ao cliente e que o parceiro pode participar do fluxo. A ordem é persistida no estado inicial, acompanhada dos dados de triagem e do primeiro evento de histórico.

Quando o parceiro abre a ordem, a autorização verifica sua correspondência com o campo `partner_id`. O diagnóstico e os itens do orçamento são submetidos à política de ordem, que aceita a operação somente nos estados `pending` ou `quoted`. O cliente recebe a proposta e pode aprovar ou cancelar, de acordo com as condições da máquina de estados.

**Figura X - Sequência de solicitação, diagnóstico e decisão do orçamento**

> Inserir o diagrama de sequência de orçamento produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

#### 5.4.4 Execução técnica e avaliação

Uma ordem aprovada pode ser iniciada pelo parceiro. As atualizações posteriores também passam pela política de transição. O estado `waiting_parts` representa uma interrupção temporária e admite retorno a `in_progress`. O estado `ready` indica que o serviço técnico terminou, enquanto `completed` representa o encerramento da ordem.

A avaliação ocorre depois da conclusão e não modifica o estado. O servidor verifica propriedade, estado e ausência de avaliação anterior. A persistência reforça a unicidade pelo relacionamento entre avaliação e ordem.

**Figura X - Sequência de atualização técnica e avaliação**

> Inserir o diagrama de sequência técnica produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

### 5.5 Diagrama de estados da ordem

A máquina de estados controla as transições permitidas para uma ordem de serviço. Esse controle reduz situações inconsistentes, como concluir um reparo que ainda não foi iniciado ou permitir que a assistência aprove o próprio orçamento em nome do cliente.

O estado `pending` é atribuído no momento da criação. A emissão ou revisão do orçamento produz `quoted`. A partir desse estado, o cliente pode aprovar e produzir `approved`, ou cancelar e produzir `cancelled`. A ordem pendente também pode ser cancelada antes da emissão do orçamento.

O parceiro inicia uma ordem aprovada, gerando `in_progress`. A partir daí, pode indicar espera por peças ou finalização do reparo. O retorno de `waiting_parts` para `in_progress` representa a retomada da execução. Uma ordem pronta pode ser concluída. Os estados `completed` e `cancelled` são terminais no fluxo atual.

O diagrama de estados e sua tabela de rótulos são apresentados no Capítulo 4. A implementação correspondente está centralizada na política da ordem, e o banco restringe o valor persistido ao conjunto de estados aceitos.

### 5.6 Modelo de domínio

O modelo de domínio representa as entidades centrais sem reproduzir todas as classes de infraestrutura. São consideradas entidades de domínio Cliente, Parceiro, Endereço, Dispositivo, Serviço do Parceiro, Ordem de Reparo, Avaliação e Mensagem de Suporte.

Cliente e Parceiro são contas distintas no banco. Não existe uma tabela genérica de usuários da qual ambas herdem fisicamente. Essa decisão reflete o schema existente e evita representar uma hierarquia que não é utilizada pela persistência.

Um cliente possui endereços e dispositivos. Também solicita ordens e escreve avaliações. Um parceiro possui endereços, oferece serviços, atende ordens e recebe avaliações. A ordem relaciona um cliente, um parceiro e um dispositivo pertencente ao próprio cliente.

O endereço utiliza propriedade alternativa: pode pertencer a um cliente ou a um parceiro, mas nunca aos dois simultaneamente. Essa condição é protegida por uma restrição no banco. Mensagens de suporte sempre envolvem um cliente e podem ter como destino a SmartFix ou uma assistência.

**Figura X - Modelo de domínio do SmartFix**

> Inserir o modelo de domínio produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

O Quadro 7 resume as responsabilidades das entidades.

**Quadro 7 - Entidades centrais do domínio**

| Entidade | Responsabilidade |
| --- | --- |
| Cliente | Identificar o solicitante e concentrar seus dados operacionais. |
| Parceiro | Representar a assistência técnica e sua aprovação. |
| Endereço | Registrar localização de cliente ou parceiro. |
| Dispositivo | Identificar o equipamento pertencente ao cliente. |
| Serviço do parceiro | Descrever oferta, preço-base e prazo estimado. |
| Ordem de reparo | Concentrar problema, participantes, orçamento, estado e histórico. |
| Avaliação | Registrar a experiência do cliente após a conclusão. |
| Mensagem de suporte | Registrar comunicação entre cliente e destinatário autorizado. |

Fonte: Elaborado pelos autores (2026).

### 5.7 Diagrama de componentes

O diagrama de componentes apresenta cinco agrupamentos: navegador, entrada web, aplicação, persistência e integrações externas. O navegador envia requisições à entrada do Next.js, que resolve páginas ou APIs. Dentro da aplicação, páginas e componentes React formam a interface, enquanto os Route Handlers recebem requisições de dados.

Controllers conectam a camada HTTP aos serviços. Políticas controlam autorização e transições. Validações tratam formatos e limites. Models e repository acessam o PostgreSQL por meio do Sequelize. Essa organização permite que a mesma regra seja aplicada independentemente do botão ou tela que iniciou a operação.

As integrações externas aparecem com conexões opcionais. Elas não substituem a lógica principal nem recebem acesso ao banco. Essa representação também evita sugerir que Google, Photon ou Resend façam parte do mesmo domínio de implantação da aplicação.

O diagrama de componentes apresentado no início deste capítulo é uma visão lógica. Ele não implica que cada caixa seja implantada separadamente.

### 5.8 Diagrama de implantação

O modelo de implantação diferencia dispositivos dos usuários, entrada HTTPS, ambiente de aplicação, banco e serviços externos. Usuários em navegadores desktop ou móveis acessam o domínio da aplicação. A execução do Next.js ocorre em ambiente Node.js compatível, que mantém as variáveis de configuração e as credenciais do banco.

O PostgreSQL pode ser executado localmente durante o desenvolvimento ou por um provedor gerenciado, como o Supabase Postgres. Em ambientes que exigem criptografia de transporte, a conexão utiliza TLS e validação do certificado configurado. Essa comunicação ocorre somente entre servidor e banco.

Google OAuth, Photon/OpenStreetMap e Resend permanecem fora do limite principal da implantação. Seu uso depende de configuração, disponibilidade e tratamento de erro. O modelo não inclui bucket de arquivos, WebSocket, gateway de pagamento ou infraestrutura logística, pois esses componentes não foram confirmados.

**Figura X - Diagrama de implantação do SmartFix**

> Inserir o diagrama de implantação produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

O diagrama representa possibilidades compatíveis com o projeto, mas não afirma que uma implantação pública específica esteja ativa. Evidências de domínio, monitoramento, disponibilidade e backup deverão ser apresentadas apenas quando existir ambiente produtivo verificável.

### 5.9 Modelo entidade-relacionamento

O modelo entidade-relacionamento descreve a persistência utilizada pela aplicação. As tabelas principais são `clients`, `partner`, `client_addresses`, `devices`, `partner_services`, `repair_orders`, `reviews` e `support_messages`. Duas tabelas auxiliares completam o modelo: `workflow_records`, utilizada para registros de workflow que não correspondem a ordens, e `smartfix_migrations`, utilizada para controle de versões do schema.

**Figura X - Modelo entidade-relacionamento do SmartFix**

> Inserir o DER consolidado produzido na Parte 4.

Fonte: Elaborado pelos autores (2026).

#### 5.9.1 Clientes e parceiros

As tabelas `clients` e `partner` armazenam identificadores próprios, dados cadastrais e hashes de senha. E-mail e documento possuem unicidade dentro da tabela correspondente. O parceiro também mantém nome empresarial e condição de aprovação.

Os identificadores dessas tabelas representam as próprias contas SmartFix. Não há dependência de uma identidade externa do Supabase Auth. Quando Google OAuth é utilizado, o vínculo externo é controlado pela aplicação sem substituir a conta principal.

#### 5.9.2 Endereços

`client_addresses` atende tanto clientes quanto parceiros. Os campos `client_id` e `partner_id` são opcionais isoladamente, mas uma restrição exige que exatamente um deles esteja preenchido. A exclusão de uma conta remove seus endereços conforme as regras de cascata.

Além dos dados postais, a tabela registra um apelido e a indicação de endereço principal. Regras adicionais da aplicação impedem que o cliente remova o endereço principal ou fique sem endereço.

#### 5.9.3 Dispositivos

`devices` possui chave estrangeira para o cliente em `user_id`. A tabela registra tipo, marca, modelo, referência de foto, apelido, número de série e informações iniciais do defeito. A API não aceita livremente o proprietário; ele é definido a partir da sessão.

Um índice composto entre dispositivo e proprietário participa da integridade das ordens. Dessa forma, não basta fornecer um identificador de dispositivo existente: ele também precisa pertencer ao cliente vinculado à ordem.

#### 5.9.4 Ordens de reparo

`repair_orders` é a entidade central do processo. Contém cliente, parceiro, dispositivo, descrição do problema, estado, valor estimado, rótulo do dispositivo, diagnóstico, sintomas, checklist, orçamento, histórico e data de criação.

Sintomas, checklist, itens de orçamento e histórico são armazenados como JSONB estruturado. Essa escolha permite manter coleções associadas à ordem sem criar uma tabela para cada item. Restrições garantem que os campos tenham formato de array. O total estimado é calculado a partir dos itens do orçamento e armazenado como valor decimal.

As chaves estrangeiras para cliente, parceiro e dispositivo utilizam exclusão restrita. Uma chave composta confirma que o dispositivo pertence ao cliente da ordem. Assim, a integridade não depende exclusivamente da aplicação.

#### 5.9.5 Avaliações

`reviews` relaciona cliente, parceiro e ordem. A nota aceita valores inteiros entre um e cinco. O identificador da ordem é único, impedindo mais de uma avaliação para o mesmo reparo.

A combinação das partes da avaliação deve corresponder ao cliente e ao parceiro registrados na ordem. Além da validação da aplicação, o banco possui mecanismos para impedir avaliação de ordem não concluída e associações incompatíveis.

#### 5.9.6 Serviços e mensagens

`partner_services` registra o catálogo de cada assistência. Valores monetários são armazenados em centavos para evitar ambiguidades de ponto flutuante. Prazo e preço possuem limites de integridade. Serviços podem ser marcados como ativos ou inativos.

`support_messages` registra conversas entre clientes e a SmartFix ou uma assistência. `recipient_role` define o tipo de destino, e `partner_id` deve ser preenchido somente quando a assistência for destinatária. O remetente é identificado para auditoria. O corpo é textual, limitado e não pode permanecer vazio.

#### 5.9.7 Tabelas auxiliares

`workflow_records` armazena notificações, tokens de redefinição, identidades Google e registros auxiliares. O campo `kind` distingue o tipo e `data` contém um objeto JSONB. Ordens e avaliações deixaram de ser duplicadas nessa estrutura e utilizam suas tabelas relacionais próprias.

`smartfix_migrations` registra o nome e a data das migrations aplicadas. O migrador utiliza esse histórico para executar somente alterações pendentes.

### 5.10 Dicionário resumido de dados

O dicionário completo deverá compor um apêndice. O Quadro 8 apresenta os principais campos de cada entidade.

**Quadro 8 - Dicionário resumido de dados**

| Tabela | Campos principais | Observações |
| --- | --- | --- |
| `clients` | `id`, `full_name`, `email`, `phone`, `tax_id`, `birth_date`, `password_hash` | Conta do cliente; e-mail e documento únicos. |
| `partner` | `id`, `full_name`, `company_name`, `email`, `tax_id`, `is_approved`, `password_hash` | Conta da assistência e condição de aprovação. |
| `client_addresses` | proprietário, dados postais, `is_principal` | Exatamente um proprietário. |
| `devices` | `user_id`, tipo, marca, modelo, foto, apelido, série e defeito | Pertence ao cliente. |
| `repair_orders` | participantes, problema, estado, diagnóstico, orçamento e histórico | Entidade central do workflow. |
| `reviews` | ordem, participantes, nota, comentário e data | Uma por ordem concluída. |
| `partner_services` | parceiro, nome, descrição, preço, prazo e situação | Catálogo da assistência. |
| `support_messages` | cliente, destino, remetente, corpo e data | Conversa com SmartFix ou parceiro. |
| `workflow_records` | `kind`, `owner_id`, `data` | Notificação, recuperação e OAuth. |
| `smartfix_migrations` | `name`, `applied_at` | Controle de versão do schema. |

Fonte: Elaborado pelos autores (2026).

### 5.11 Segurança e controle de acesso

A segurança do SmartFix utiliza controles complementares nas camadas de aplicação e banco. Nenhuma medida isolada é tratada como suficiente.

#### 5.11.1 Credenciais e sessão

Senhas novas são processadas com bcrypt antes da persistência. A aplicação possui compatibilidade temporária para detectar registros antigos e atualizar hashes quando necessário. A sessão contém somente os dados mínimos de identidade e papel, é assinada com segredo do ambiente e rejeita conteúdo adulterado ou malformado.

Tokens de recuperação possuem finalidade específica e prazo limitado. O estado OAuth também é assinado e validado para reduzir tentativas de adulteração ou reutilização indevida.

#### 5.11.2 Autorização por papel e propriedade

O papel determina a área de acesso geral. A propriedade restringe o recurso individual. Por exemplo, possuir o papel de cliente não permite consultar todas as ordens: o identificador da sessão precisa coincidir com `client_id`. O mesmo princípio é aplicado ao parceiro por meio de `partner_id`.

As ações administrativas exigem que a conta autenticada esteja incluída na configuração `ADMIN_USER_IDS`. Campos privilegiados não podem ser definidos por um formulário comum de perfil.

#### 5.11.3 Validação e respostas

Schemas Zod verificam tipos, limites, formatos e combinações antes da execução das regras. O serviço de resposta evita que erros de parser ou páginas HTML inesperadas sejam exibidos ao usuário como detalhes internos. Mensagens de falha são convertidas em respostas controladas.

#### 5.11.4 Proteções do banco

Chaves estrangeiras, unicidade, restrições `CHECK`, triggers e transações reforçam as regras. Row Level Security permanece habilitada nas tabelas da aplicação. Os papéis públicos `anon` e `authenticated` não possuem acesso direto, conforme verificado pelo smoke test. As operações legítimas utilizam a conexão privada do servidor.

Na validação realizada em 3 de outubro de 2026, nove tabelas apresentaram RLS ativo e acesso do servidor confirmado. O smoke test verificou ainda propriedade, cascatas, exclusões restritas, nota de avaliação e unicidade por ordem.

#### 5.11.5 Limites das afirmações de segurança

Os mecanismos descritos reduzem riscos e demonstram controles implementados. Contudo, não permitem afirmar segurança absoluta. Uma avaliação mais ampla exigiria análise de dependências, testes de penetração, revisão de configuração do ambiente implantado, monitoramento e procedimentos operacionais.

### 5.12 Síntese do capítulo

A modelagem atualizada descreve um sistema web em camadas, com responsabilidades separadas e persistência relacional. Os modelos comportamentais demonstram o caminho entre solicitação, diagnóstico, orçamento, reparo e avaliação. A máquina de estados limita as transições, enquanto o modelo de domínio e o DER registram propriedade e relacionamentos.

A arquitetura mantém o banco restrito ao servidor e combina validação, autorização, políticas e restrições relacionais. Integrações externas são tratadas como dependências opcionais, sem ampliar artificialmente o escopo entregue. O próximo capítulo apresentará como esses modelos foram materializados nas interfaces e nos módulos de implementação.
