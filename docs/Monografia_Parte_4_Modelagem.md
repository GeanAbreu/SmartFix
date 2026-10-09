# SmartFix - Parte 4: modelagem atualizada do sistema

**Data:** 3 de outubro de 2026  
**Objetivo:** representar a versão implementada do SmartFix por meio de modelos comportamentais, estruturais, arquiteturais e de dados.  
**Formato-fonte:** Mermaid editável, destinado à revisão e posterior exportação em alta resolução para a monografia.

## 1. Premissas da modelagem

Os diagramas desta parte seguem as conclusões das Partes 1, 2 e 3:

- o SmartFix é uma plataforma web responsiva;
- os atores operacionais atuais são cliente, assistência técnica parceira e administrador;
- entregador não é ator da versão atual;
- pagamento e logística não fazem parte do fluxo implementado;
- o navegador acessa as APIs Next.js, nunca diretamente o PostgreSQL;
- a autenticação principal utiliza credenciais próprias, hash bcrypt e sessão assinada;
- Google OAuth e envio de e-mail são integrações opcionais;
- somente assistências aprovadas aparecem na descoberta;
- toda ordem vincula cliente, dispositivo do cliente e parceiro;
- as transições da ordem obedecem à política implementada.

## 2. Auditoria dos diagramas anteriores

| Diagrama anterior | Problema encontrado | Tratamento |
| --- | --- | --- |
| Casos de uso | Inclui entregador, pagamento, gestão completa de usuários e relatórios. | Substituído pelos atores e casos confirmados. |
| Atividades | Inclui motoboy, entrega, garantia e aceite do pedido pelo parceiro. | Substituído pelo fluxo real de solicitação, orçamento e reparo. |
| Sequência | Inclui coleta, pagamento e entrega; não representa APIs nem autorização. | Dividido em sequências menores e rastreáveis. |
| Estados | Condiciona reparo ao pagamento e utiliza estados inexistentes. | Substituído pelos oito estados reais. |
| Classes | Contém herança de usuário e entidade Pagamento inexistentes. | Substituído por modelo de domínio aderente aos modelos atuais. |
| Componentes | Afirma PWA, Supabase Auth, Realtime e gateway de pagamento. | Substituído pela arquitetura Next.js e PostgreSQL do servidor. |
| Implantação | Afirma PWA, WebSocket e bucket de mídia. | Substituído pelo cenário comprovado e pelas integrações opcionais. |
| DER | A versão recente está majoritariamente alinhada ao banco. | Consolidado e complementado com cardinalidades e tabelas auxiliares. |

## 3. Diagrama de casos de uso

### 3.1 Finalidade

Apresentar as capacidades disponíveis para cada ator. Como Mermaid não possui suporte nativo completo a UML de casos de uso, o modelo utiliza um fluxograma de associações, preservando a distinção entre atores e funcionalidades.

```mermaid
flowchart LR
    clientActor[Cliente]
    partnerActor[Assistência técnica]
    adminActor[Administrador]

    subgraph smartfixSystem[Plataforma SmartFix]
        accountUse([Gerenciar conta e sessão])
        addressUse([Gerenciar endereços])
        deviceUse([Gerenciar dispositivos])
        discoverUse([Buscar assistências aprovadas])
        requestUse([Solicitar reparo])
        trackUse([Acompanhar ordem])
        decideUse([Aprovar ou cancelar orçamento])
        reviewUse([Avaliar assistência])
        supportUse([Conversar com suporte])
        noticeUse([Consultar notificações])

        catalogUse([Gerenciar catálogo de serviços])
        quoteUse([Diagnosticar e orçar])
        statusUse([Atualizar estado do reparo])
        partnerOrdersUse([Consultar ordens vinculadas])

        approveUse([Aprovar assistência])
        adminSupportUse([Atender conversas da SmartFix])
    end

    clientActor --> accountUse
    clientActor --> addressUse
    clientActor --> deviceUse
    clientActor --> discoverUse
    clientActor --> requestUse
    clientActor --> trackUse
    clientActor --> decideUse
    clientActor --> reviewUse
    clientActor --> supportUse
    clientActor --> noticeUse

    partnerActor --> accountUse
    partnerActor --> catalogUse
    partnerActor --> quoteUse
    partnerActor --> statusUse
    partnerActor --> partnerOrdersUse
    partnerActor --> noticeUse

    adminActor --> accountUse
    adminActor --> approveUse
    adminActor --> adminSupportUse
```

### 3.2 Interpretação

O cliente concentra as operações de preparação e acompanhamento do reparo. O parceiro administra sua oferta e executa as etapas técnicas. O administrador atual possui escopo restrito ao credenciamento de assistências e às APIs de atendimento direcionadas à SmartFix. Gestão geral de usuários, relatórios, pagamentos e logística não aparecem porque não integram a versão atual.

## 4. Diagrama de atividades do fluxo principal

### 4.1 Finalidade

Representar o caminho da solicitação até a conclusão, incluindo cancelamento e espera de peças.

```mermaid
flowchart TD
    start([Início]) --> authenticated{Cliente autenticado?}
    authenticated -->|Não| login[Realizar cadastro ou login]
    login --> setup[Manter endereço e dispositivo]
    authenticated -->|Sim| setup
    setup --> discover[Buscar assistência aprovada]
    discover --> choose[Selecionar assistência e dispositivo]
    choose --> describe[Informar problema, sintomas e checklist]
    describe --> create[Enviar solicitação]
    create --> pending[Aguardar diagnóstico]
    pending --> quote[Parceiro registra diagnóstico e orçamento]
    quote --> decision{Cliente aprova?}
    decision -->|Não| cancel[Cancelar ordem]
    cancel --> cancelled([Ordem cancelada])
    decision -->|Sim| approved[Registrar aprovação]
    approved --> repair[Parceiro inicia reparo]
    repair --> parts{Necessita aguardar peças?}
    parts -->|Sim| waiting[Aguardar peças]
    waiting --> repair
    parts -->|Não| ready[Marcar como pronta para retirada]
    ready --> complete[Concluir ordem]
    complete --> evaluate{Cliente deseja avaliar?}
    evaluate -->|Sim| review[Registrar avaliação]
    evaluate -->|Não| finish([Fim])
    review --> finish
```

### 4.2 Responsabilidades

- cliente: autenticar-se, preparar dados, escolher assistência, solicitar, decidir sobre orçamento e avaliar;
- parceiro: diagnosticar, orçar e atualizar as etapas técnicas;
- sistema: validar autorização, persistir mudanças, manter histórico e disponibilizar notificações.

Não há aceite prévio da solicitação pelo parceiro. A primeira ação técnica prevista é registrar diagnóstico e orçamento.

## 5. Diagramas de sequência

Os fluxos foram separados para evitar um único diagrama excessivamente longo.

### 5.1 Cadastro e autenticação por senha

```mermaid
sequenceDiagram
    autonumber
    actor visitor as Visitante
    participant web as Interface Next.js
    participant api as API de autenticação
    participant validation as Validação Zod
    participant password as Serviço de senha
    participant database as PostgreSQL
    participant session as Serviço de sessão

    visitor->>web: Preenche cadastro
    web->>api: POST /api/auth/register
    api->>validation: Validar dados e endereço
    validation-->>api: Dados normalizados
    api->>password: Gerar hash bcrypt
    password-->>api: Hash da senha
    api->>database: Criar conta e endereço
    database-->>api: Conta criada
    api->>session: Assinar sessão mínima
    session-->>api: Cookie de sessão
    api-->>web: Cadastro concluído
    web-->>visitor: Abrir área do perfil
```

**Variações:** dados inválidos encerram o fluxo antes da persistência; documento ou e-mail duplicado produz resposta controlada; parceiro recém-cadastrado permanece sem aprovação administrativa.

### 5.2 Descoberta geográfica de assistências

```mermaid
sequenceDiagram
    autonumber
    actor client as Cliente
    participant web as Interface de busca
    participant api as API de descoberta
    participant auth as Autorização
    participant database as PostgreSQL
    participant geo as Serviço de geocodificação
    participant distance as Cálculo de distância

    client->>web: Seleciona origem e raio
    web->>api: POST /api/partners/nearby
    api->>auth: Validar sessão de cliente
    auth-->>api: Cliente autorizado
    api->>database: Consultar origem quando cadastrada
    database-->>api: Endereço do próprio cliente
    api->>geo: Localizar origem
    geo-->>api: Coordenadas válidas
    api->>database: Consultar parceiros aprovados e endereços
    database-->>api: Parceiros elegíveis
    loop Cada parceiro com endereço
        api->>geo: Localizar CEP do parceiro
        geo-->>api: Coordenadas ou ausência
        api->>distance: Calcular distância aproximada
        distance-->>api: Distância em quilômetros
    end
    api-->>web: Resultados no raio e ordenados
    web-->>client: Exibir lista e mapa
```

**Regra de precisão:** o cálculo representa distância geográfica aproximada, não rota de deslocamento. Localizações ausentes não são inventadas.

### 5.3 Solicitação, diagnóstico e decisão do orçamento

```mermaid
sequenceDiagram
    autonumber
    actor client as Cliente
    actor partner as Assistência técnica
    participant clientWeb as Área do cliente
    participant partnerWeb as Área do parceiro
    participant api as API de ordens
    participant policy as Política da ordem
    participant database as PostgreSQL

    client->>clientWeb: Informa dispositivo, parceiro e defeito
    clientWeb->>api: POST /api/orders
    api->>database: Confirmar dispositivo próprio e parceiro aprovado
    database-->>api: Vínculos válidos
    api->>database: Criar ordem pending e notificação
    database-->>api: Ordem criada
    api-->>clientWeb: Solicitação confirmada

    partner->>partnerWeb: Abre ordem vinculada
    partnerWeb->>api: PATCH /api/orders/:id com orçamento
    api->>policy: Validar papel, estado e itens
    policy-->>api: Transição pending para quoted
    api->>database: Salvar diagnóstico, orçamento e histórico
    database-->>api: Ordem atualizada
    api-->>partnerWeb: Orçamento enviado

    client->>clientWeb: Consulta orçamento
    alt Cliente aprova
        clientWeb->>api: PATCH /api/orders/:id com approve
        api->>policy: Validar proprietário e estado quoted
        policy-->>api: Transição para approved
        api->>database: Salvar estado e histórico
        api-->>clientWeb: Aprovação confirmada
    else Cliente cancela
        clientWeb->>api: PATCH /api/orders/:id com cancel
        api->>policy: Validar proprietário e estado permitido
        policy-->>api: Transição para cancelled
        api->>database: Salvar estado e histórico
        api-->>clientWeb: Cancelamento confirmado
    end
```

### 5.4 Atualização técnica e avaliação

```mermaid
sequenceDiagram
    autonumber
    actor partner as Assistência técnica
    actor client as Cliente
    participant partnerWeb as Gestão de ordens
    participant clientWeb as Acompanhamento
    participant api as API de ordens
    participant policy as Política da ordem
    participant database as PostgreSQL

    partner->>partnerWeb: Inicia reparo aprovado
    partnerWeb->>api: PATCH status in_progress
    api->>policy: Validar transição
    policy-->>api: Permitida
    api->>database: Atualizar estado e histórico

    alt Necessita peças
        partnerWeb->>api: PATCH status waiting_parts
        api->>database: Atualizar estado e histórico
        partnerWeb->>api: PATCH status in_progress
        api->>database: Registrar retorno ao reparo
    end

    partnerWeb->>api: PATCH status ready
    api->>database: Atualizar estado e histórico
    partnerWeb->>api: PATCH status completed
    api->>database: Concluir ordem
    api-->>clientWeb: Ordem concluída disponível
    client->>clientWeb: Envia nota e comentário
    clientWeb->>api: PATCH /api/orders/:id com review
    api->>policy: Validar proprietário, conclusão e unicidade
    policy-->>api: Avaliação permitida
    api->>database: Criar avaliação
    api-->>clientWeb: Avaliação registrada
```

## 6. Diagrama de estados da ordem de serviço

### 6.1 Estados canônicos

| Estado técnico | Rótulo exibido |
| --- | --- |
| `pending` | Aguardando diagnóstico |
| `quoted` | Aguardando aprovação |
| `approved` | Orçamento aprovado |
| `in_progress` | Em reparo |
| `waiting_parts` | Aguardando peças |
| `ready` | Pronto para retirada |
| `completed` | Concluído |
| `cancelled` | Cancelado |

```mermaid
stateDiagram-v2
    direction LR

    Pending: Aguardando diagnóstico
    Quoted: Aguardando aprovação
    Approved: Orçamento aprovado
    InProgress: Em reparo
    WaitingParts: Aguardando peças
    Ready: Pronto para retirada
    Completed: Concluído
    Cancelled: Cancelado

    [*] --> Pending: criar solicitação
    Pending --> Quoted: emitir orçamento
    Pending --> Cancelled: cliente cancela
    Quoted --> Quoted: revisar orçamento
    Quoted --> Approved: cliente aprova
    Quoted --> Cancelled: cliente cancela
    Approved --> InProgress: iniciar reparo
    InProgress --> WaitingParts: aguardar peças
    WaitingParts --> InProgress: retomar reparo
    InProgress --> Ready: finalizar reparo
    Ready --> Completed: concluir ordem
    Completed --> [*]
    Cancelled --> [*]
```

Não existe transição de `approved` diretamente para `completed`. O sistema também não condiciona `in_progress` à confirmação de pagamento.

## 7. Modelo de domínio

### 7.1 Finalidade

Mostrar as entidades centrais e seus relacionamentos conceituais. Este modelo não pretende reproduzir todas as classes internas de controller e service.

```mermaid
classDiagram
    class Client {
        +UUID id
        +string fullName
        +string email
        +string phone
        +string taxId
        +date birthDate
        +string passwordHash
    }

    class Partner {
        +UUID id
        +string fullName
        +string companyName
        +string email
        +string taxId
        +boolean isApproved
        +string passwordHash
    }

    class Address {
        +UUID id
        +UUID clientId
        +UUID partnerId
        +string label
        +string postalCode
        +string street
        +string city
        +string state
        +boolean isPrimary
    }

    class Device {
        +UUID id
        +UUID clientId
        +string deviceType
        +string brand
        +string model
        +string nickname
        +string serialNumber
        +string issueType
    }

    class RepairOrder {
        +UUID id
        +UUID clientId
        +UUID partnerId
        +UUID deviceId
        +string problemDescription
        +OrderStatus status
        +string diagnosis
        +QuoteItem[] quote
        +StatusEvent[] history
    }

    class PartnerService {
        +UUID id
        +UUID partnerId
        +string name
        +int unitPriceCents
        +int estimatedDays
        +boolean isActive
    }

    class Review {
        +UUID id
        +UUID repairOrderId
        +int rating
        +string comment
        +date reviewDate
    }

    class SupportMessage {
        +UUID id
        +UUID clientId
        +string recipientRole
        +UUID partnerId
        +string senderRole
        +UUID senderId
        +string body
        +datetime createdAt
    }

    Client "1" --> "1..*" Address : possui
    Partner "1" --> "1..*" Address : possui
    Client "1" --> "0..*" Device : cadastra
    Client "1" --> "0..*" RepairOrder : solicita
    Partner "1" --> "0..*" RepairOrder : atende
    Device "1" --> "0..*" RepairOrder : origina
    Partner "1" --> "0..*" PartnerService : oferece
    RepairOrder "1" --> "0..1" Review : gera
    Client "1" --> "0..*" Review : escreve
    Partner "1" --> "0..*" Review : recebe
    Client "1" --> "0..*" SupportMessage : participa
    Partner "0..1" --> "0..*" SupportMessage : recebe
```

### 7.2 Observações

- `Address` possui um único proprietário lógico: cliente ou parceiro;
- `Review` depende de ordem concluída e é única por ordem;
- `SupportMessage` pode ter a SmartFix como destinatária sem um parceiro associado;
- orçamento e histórico são objetos estruturados armazenados com a ordem;
- notificações, recuperação e identidade Google utilizam registros auxiliares de workflow.

## 8. Diagrama de componentes

### 8.1 Finalidade

Representar as responsabilidades internas sem sugerir microserviços inexistentes. A aplicação é um único projeto Next.js organizado em camadas.

```mermaid
flowchart LR
    subgraph client["Cliente"]
        browser["Navegador responsivo"]
    end

    subgraph gateway["Entrada web"]
        nextRouter["Next.js App Router"]
    end

    subgraph service["Aplicação SmartFix"]
        pages["Páginas e componentes React"]
        routes["Route Handlers"]
        controllers["Controllers"]
        domain["Serviços, políticas e validações"]
        persistence["Models e repository"]
    end

    subgraph datastore["Persistência"]
        postgres["PostgreSQL"]
    end

    subgraph external["Integrações opcionais"]
        google["Google OAuth"]
        photon["Photon e OpenStreetMap"]
        resend["Resend"]
    end

    browser -->|"HTTPS"| nextRouter
    nextRouter -->|"Renderiza"| pages
    nextRouter -->|"Roteia API"| routes
    pages -->|"JSON"| routes
    routes -->|"Delega"| controllers
    controllers -->|"Aplica regras"| domain
    domain -->|"Persiste"| persistence
    persistence -->|"SQL e transações"| postgres
    domain -.->|"Google: autenticação"| google
    domain -.->|"Photon: geocodificação"| photon
    domain -.->|"Resend: e-mail"| resend
```

### 8.2 Responsabilidades das camadas

| Camada | Responsabilidade |
| --- | --- |
| Páginas e componentes | Interface, formulários, navegação e apresentação. |
| Route Handlers | Endpoints HTTP do App Router. |
| Controllers | Orquestração das requisições e respostas. |
| Serviços e políticas | Autenticação, autorização, regras de ordem, dashboards e integrações. |
| Validações | Normalização e rejeição de entradas inválidas. |
| Models e repository | Mapeamento Sequelize e persistência. |
| PostgreSQL | Integridade relacional, dados operacionais, migrations e RLS. |

## 9. Diagrama de implantação

### 9.1 Cenário de execução

O repositório suporta execução local e implantação em provedor compatível com Next.js. Vercel e Supabase podem compor o ambiente, mas o diagrama diferencia dependências obrigatórias de serviços opcionais.

```mermaid
flowchart LR
    subgraph client["Dispositivos dos usuários"]
        desktop["Navegador desktop"]
        mobile["Navegador móvel"]
    end

    subgraph gateway["Camada HTTPS"]
        webEntry["Domínio e entrada da aplicação"]
    end

    subgraph service["Ambiente Node.js"]
        nextApp["Aplicação Next.js SmartFix"]
    end

    subgraph datastore["Banco gerenciado ou local"]
        database["PostgreSQL"]
    end

    subgraph external["Serviços externos configuráveis"]
        oauthProvider["Google OAuth"]
        geoProvider["Photon e OpenStreetMap"]
        emailProvider["Resend"]
    end

    desktop -->|"HTTPS"| webEntry
    mobile -->|"HTTPS"| webEntry
    webEntry -->|"Requisições web"| nextApp
    nextApp -->|"Conexão PostgreSQL com TLS quando exigido"| database
    nextApp -.->|"Google: OAuth"| oauthProvider
    nextApp -.->|"Photon: localização"| geoProvider
    nextApp -.->|"Resend: recuperação"| emailProvider
```

### 9.2 Limites do diagrama

- não afirma que a implantação de produção já está ativa;
- não inclui bucket de mídia porque não há fluxo completo de upload confirmado;
- não utiliza WebSocket porque os fluxos atuais não dependem dele;
- não utiliza acesso direto do navegador ao Supabase;
- não apresenta CDN, observabilidade ou backup sem configuração comprovada.

## 10. Modelo entidade-relacionamento

### 10.1 DER consolidado

```mermaid
erDiagram
    CLIENTS ||--o{ DEVICES : owns
    CLIENTS ||--o{ REPAIR_ORDERS : requests
    PARTNER ||--o{ REPAIR_ORDERS : services
    DEVICES ||--o{ REPAIR_ORDERS : identifies
    CLIENTS ||--o{ REVIEWS : writes
    PARTNER ||--o{ REVIEWS : receives
    REPAIR_ORDERS ||--o| REVIEWS : yields
    CLIENTS o|--o{ CLIENT_ADDRESSES : client_owner
    PARTNER o|--o{ CLIENT_ADDRESSES : partner_owner
    PARTNER ||--o{ PARTNER_SERVICES : offers
    CLIENTS ||--o{ SUPPORT_MESSAGES : participates
    PARTNER o|--o{ SUPPORT_MESSAGES : receives

    CLIENTS {
        uuid id PK
        text full_name
        text email UK
        text phone
        text tax_id UK
        date birth_date
        text password_hash
        timestamptz created_at
    }

    PARTNER {
        uuid id PK
        text full_name
        text company_name
        text email UK
        text phone
        text tax_id UK
        boolean is_approved
        text password_hash
        timestamptz created_at
        timestamptz updated_at
    }

    CLIENT_ADDRESSES {
        uuid id PK
        uuid client_id FK
        uuid partner_id FK
        text apelido
        text cep
        text logradouro
        text numero
        text complemento
        text bairro
        text municipio
        text uf
        boolean is_principal
    }

    DEVICES {
        uuid id PK
        uuid user_id FK
        text device_type
        text brand
        text model
        text photo_url
        varchar nickname
        varchar serial_number
        text issue_type
        text issue_description
    }

    REPAIR_ORDERS {
        uuid id PK
        uuid client_id FK
        uuid partner_id FK
        uuid device_id FK
        text problem_description
        text status
        decimal estimated_budget
        text device_label
        text diagnosis
        jsonb symptoms
        jsonb checklist
        jsonb quote
        jsonb history
        timestamptz created_at
    }

    REVIEWS {
        uuid id PK
        uuid client_id FK
        uuid partner_id FK
        uuid repair_order_id FK,UK
        int rating
        text comment
        date review_date
    }

    PARTNER_SERVICES {
        uuid id PK
        uuid partner_id FK
        varchar name
        text description
        int unit_price_cents
        int estimated_days
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    SUPPORT_MESSAGES {
        uuid id PK
        uuid client_id FK
        varchar recipient_role
        uuid partner_id FK
        varchar sender_role
        uuid sender_id
        varchar body
        timestamptz created_at
    }

    WORKFLOW_RECORDS {
        uuid id PK
        varchar kind
        uuid owner_id
        jsonb data
    }

    SMARTFIX_MIGRATIONS {
        text name PK
        timestamptz applied_at
    }
```

### 10.2 Restrições relevantes do DER

1. `CLIENT_ADDRESSES` exige exatamente um proprietário entre cliente e parceiro.
2. `DEVICES.user_id` referencia o cliente proprietário.
3. A chave estrangeira composta da ordem impede vincular dispositivo de outro cliente.
4. Cliente, parceiro e dispositivo referenciados por ordem utilizam exclusão restrita.
5. `REVIEWS.repair_order_id` é único.
6. A avaliação deve repetir o mesmo cliente e parceiro da ordem.
7. A nota fica entre 1 e 5.
8. O estado da ordem pertence ao conjunto de estados permitido.
9. Sintomas, checklist, orçamento e histórico devem ser arrays JSON.
10. Serviço do parceiro possui limites para preço e prazo.
11. Mensagem de suporte exige destino coerente e corpo não vazio.
12. RLS permanece habilitada nas tabelas da aplicação.

### 10.3 Tabelas sem relacionamento relacional explícito no DER

`WORKFLOW_RECORDS` utiliza `owner_id` e JSON estruturado para notificações, recuperação de senha, identidade Google e registros auxiliares. `SMARTFIX_MIGRATIONS` registra versões aplicadas. Essas relações são controladas pela aplicação e, por isso, as tabelas aparecem sem arestas de chave estrangeira no diagrama.

## 11. Matriz entre diagramas e requisitos

| Diagrama | Requisitos representados |
| --- | --- |
| Casos de uso | RF-01 a RF-47 em visão por ator. |
| Atividades | RF-03, RF-14 a RF-17, RF-19 a RF-34. |
| Sequência de cadastro | RF-01 a RF-05, RN-01 a RN-06. |
| Sequência de descoberta | RF-19 a RF-23, RN-15 a RN-19. |
| Sequência de orçamento | RF-24 a RF-31, RN-20 a RN-26. |
| Sequência técnica e avaliação | RF-32 a RF-34, RN-27 a RN-36. |
| Estados da ordem | RF-29 a RF-33, RN-21 a RN-33. |
| Modelo de domínio | RF-09 a RF-47 e regras de propriedade. |
| Componentes | RNF-03 a RNF-11 e RNF-14. |
| Implantação | RNF-05, RNF-06, RNF-10 e integrações condicionais. |
| DER | RNF-06 a RNF-08, RNF-13 e restrições de persistência. |

## 12. Figuras recomendadas para a monografia

Nem todos os diagramas precisam ter o mesmo tamanho ou ocupar página inteira. A seleção recomendada é:

| Figura | Uso sugerido |
| --- | --- |
| Casos de uso | Capítulo 4, após apresentar os atores. |
| Atividades | Capítulo 4, ao explicar o fluxo principal. |
| Sequência de cadastro | Capítulo 6, autenticação. |
| Sequência de descoberta | Capítulo 6, localização. |
| Sequência de orçamento | Capítulo 6, fluxo da ordem. |
| Sequência técnica e avaliação | Capítulo 6, acompanhamento. |
| Estados | Capítulo 4 ou 5, regras da ordem. |
| Modelo de domínio | Capítulo 5, visão conceitual. |
| Componentes | Capítulo 5, arquitetura lógica. |
| Implantação | Capítulo 5, arquitetura física. |
| DER | Capítulo 5, persistência. |

## 13. Orientações para exportação

Antes de inserir as figuras no documento final:

1. revisar textos e nomes com os autores;
2. renderizar cada Mermaid em formato vetorial, preferencialmente SVG;
3. usar fundo claro e tipografia legível;
4. evitar redução que torne rótulos ilegíveis;
5. numerar como figura no documento, não dentro da imagem;
6. incluir título acima ou abaixo conforme o padrão institucional adotado;
7. indicar `Fonte: Elaborado pelos autores (2026)`;
8. citar e interpretar cada figura no texto;
9. conferir a legibilidade na página A4 e no PDF final.

## 14. Resultado da Parte 4

A modelagem atualizada remove recursos inexistentes e passa a representar:

- três atores operacionais reais;
- fluxo completo de solicitação, orçamento, reparo e avaliação;
- oito estados canônicos da ordem;
- arquitetura em camadas do projeto Next.js;
- integrações externas opcionais;
- domínio e persistência PostgreSQL atuais;
- rastreabilidade com os requisitos da Parte 3.

O próximo passo é a Parte 5: preparar o plano e o inventário das capturas de tela, definir dados demonstrativos seguros e organizar a narrativa visual das interfaces do cliente, parceiro e administrador.
