# SmartFix - Parte 5: plano de capturas e narrativa visual

**Data:** 3 de outubro de 2026  
**Objetivo:** definir um processo reproduzível e seguro para capturar as interfaces que serão utilizadas na monografia.  
**Escopo desta parte:** planejamento, dados demonstrativos, roteiro, enquadramento, nomenclatura e critérios de qualidade. As imagens serão capturadas somente depois da preparação e validação do ambiente.

## 1. Princípios

As capturas de tela devem funcionar como evidência do sistema, não como decoração. Cada imagem precisa:

- demonstrar uma funcionalidade descrita no texto;
- utilizar somente dados fictícios;
- manter coerência entre cliente, dispositivo, parceiro e ordem;
- apresentar estado reconhecível e relevante;
- estar legível em página A4;
- possuir título, numeração, fonte e explicação;
- omitir credenciais, tokens, URLs sensíveis e ferramentas internas;
- representar a versão atual do código.

## 2. Ambiente demonstrativo existente

O repositório possui `smartfix-app/scripts/seed-demo.cjs`, que cria dados sintéticos e repetíveis. O conjunto previsto contém:

| Entidade | Quantidade prevista |
| --- | ---: |
| Clientes | 15 |
| Assistências técnicas | 15 |
| Endereços | 90 |
| Dispositivos | 30 |
| Serviços de parceiros | 60 |
| Ordens de reparo | 60 |
| Avaliações | 21 |

As ordens abrangem os estados `pending`, `quoted`, `approved`, `in_progress`, `waiting_parts`, `ready` e `completed`. O roteiro de captura não precisa alterar ordens reais para demonstrar todos esses estados.

### 2.1 Características de segurança do seed

- nomes, empresas, documentos, telefones e e-mails são sintéticos;
- os domínios de e-mail utilizam `.example`;
- os identificadores são reproduzíveis;
- as senhas são aleatórias;
- hashes bcrypt, e não senhas abertas, são enviados ao banco;
- credenciais de demonstração são gravadas localmente em arquivo protegido;
- o arquivo de credenciais não deve ser versionado, compartilhado ou fotografado.

### 2.2 Contas narrativas recomendadas

Para manter coerência entre figuras, o conjunto principal será:

| Papel | Identidade fictícia | Uso previsto |
| --- | --- | --- |
| Cliente principal | Ana Luiza Nascimento - `cliente01@smartfix.example` | Dashboard, dispositivos, ordens, avaliações, ajuda e perfil. |
| Parceiro principal | Selecionado entre as assistências vinculadas às ordens de Ana | Diagnóstico, orçamento e atualização de estado. |
| Administrador | Conta de demonstração explicitamente autorizada em `ADMIN_USER_IDS` | Credenciamento de parceiros. |

A senha nunca será escrita no documento. Ela será consultada apenas localmente durante a sessão de captura.

### 2.3 História visual do cliente principal

O seed fornece à cliente principal dois dispositivos e ordens em diferentes situações. Isso permite construir uma narrativa semelhante a:

1. cliente consulta o dashboard;
2. verifica seus dispositivos;
3. busca assistência próxima;
4. prepara uma nova solicitação;
5. consulta uma ordem aguardando aprovação;
6. visualiza outra ordem em andamento;
7. encontra reparo pronto para retirada;
8. consulta reparo concluído e avaliação.

Antes da captura, os vínculos e estados devem ser conferidos diretamente na interface ou no relatório do seed. A monografia não deverá atribuir a uma assistência uma ordem que pertença a outro parceiro.

## 3. Preparação do ambiente

### 3.1 Pré-condições

1. PostgreSQL configurado em ambiente de demonstração isolado;
2. migrations atualizadas;
3. variáveis locais preenchidas sem exposição pública;
4. dados sintéticos carregados;
5. integridade do seed validada;
6. aplicação executando sem erros;
7. credenciais recuperadas apenas no computador de captura;
8. conta administrativa de demonstração autorizada;
9. janela do navegador sem extensões, favoritos ou dados pessoais visíveis.

### 3.2 Comandos previstos

Executados dentro de `smartfix-app`:

```powershell
npm ci
npm run db:migrate
npm run db:check
node scripts/seed-demo.cjs --seed
node scripts/seed-demo.cjs --check
npm run dev
```

Os comandos somente serão considerados bem-sucedidos quando finalizarem sem erro. A captura não deve começar se migrations, seed ou verificação de integridade falharem.

### 3.3 Configuração opcional

Google OAuth e recuperação por e-mail não são necessários para o conjunto principal de capturas. Se não estiverem configurados, pode ser registrada uma tela que explique a indisponibilidade controlada, mas ela não deve ser apresentada como falha do sistema.

## 4. Padrão técnico das imagens

### 4.1 Resoluções

| Categoria | Resolução de captura | Uso |
| --- | --- | --- |
| Desktop principal | 1440 x 900 | Dashboards, tabelas, listas e mapas. |
| Desktop alto | 1440 x 1100 | Formulários ou detalhes extensos. |
| Mobile | 390 x 844 | Evidenciar responsividade em telas selecionadas. |
| Recorte funcional | Variável, sem redimensionamento excessivo | Destacar orçamento, histórico ou diálogo. |

Não é necessário capturar todas as telas em desktop e mobile. A responsividade deve ser demonstrada por uma amostra representativa.

### 4.2 Navegador

- zoom em 100%;
- tema claro;
- barra de favoritos oculta;
- nenhuma extensão ou perfil pessoal visível;
- console de desenvolvimento fechado;
- cursor fora de textos importantes;
- sem notificações do sistema operacional;
- página posicionada no conteúdo principal;
- largura idêntica entre capturas da mesma categoria.

### 4.3 Formato

- arquivo-mestre em PNG;
- sem recompressão destrutiva antes da inserção;
- SVG para diagramas;
- recortes feitos a partir do PNG original;
- nunca ampliar uma imagem pequena por interpolação;
- manter cópia original sem anotações.

### 4.4 Nomenclatura

```text
figura-XX-contexto-descricao-AAAA-MM-DD.png
```

Exemplos:

```text
figura-01-publico-pagina-inicial-2026-10-03.png
figura-08-cliente-busca-assistencias-2026-10-03.png
figura-17-parceiro-orcamento-2026-10-03.png
```

Os números definitivos serão definidos quando a ordem de todas as figuras da monografia estiver fechada.

## 5. Inventário das capturas

### 5.1 Área pública e autenticação

| ID | Tela/estado | Rota | Evidência demonstrada | Formato |
| --- | --- | --- | --- | --- |
| CAP-01 | Página inicial, seção principal | `/` | Proposta de valor e acesso ao sistema. | Desktop |
| CAP-02 | Página inicial responsiva | `/` | Adaptação da interface a dispositivo móvel. | Mobile |
| CAP-03 | Cadastro com escolha de perfil | `/cadastro` | Cadastro distinto de cliente e parceiro. | Desktop |
| CAP-04 | Login | `/login` | Autenticação por credencial. | Desktop |
| CAP-05 | Recuperação de senha | `/esqueci-senha` | Fluxo condicional de recuperação. | Recorte |

**Seleção para o corpo:** CAP-01, CAP-03 e CAP-04. CAP-02 pode compor um quadro de responsividade. CAP-05 é opcional.

### 5.2 Área do cliente

| ID | Tela/estado | Rota | Evidência demonstrada | Formato |
| --- | --- | --- | --- | --- |
| CAP-06 | Dashboard com ordens e pendências | `/cliente/dashboard` | Visão consolidada e ações prioritárias. | Desktop |
| CAP-07 | Endereços cadastrados | `/cliente/enderecos` | Múltiplos endereços e principal. | Desktop ou recorte |
| CAP-08 | Dispositivos cadastrados | `/cliente/dispositivos` | Garagem digital do cliente. | Desktop |
| CAP-09 | Formulário de dispositivo | `/cliente/dispositivos` | Catálogo, série e informações do defeito. | Recorte |
| CAP-10 | Busca de assistências com mapa | `/cliente/assistencias` | Geolocalização, raio e ordenação. | Desktop alto |
| CAP-11 | Detalhe da assistência | `/cliente/assistencias` | Serviços, preço-base e avaliações. | Recorte |
| CAP-12 | Nova solicitação de reparo | `/cliente/solicitar-reparo` | Dispositivo, parceiro, problema, sintomas e checklist. | Desktop alto |
| CAP-13 | Lista de reparos | `/cliente/ordens` | Busca, filtros e estados distintos. | Desktop |
| CAP-14 | Ordem aguardando aprovação | `/cliente/ordens` | Diagnóstico e orçamento detalhado. | Desktop ou recorte |
| CAP-15 | Histórico de uma ordem | `/cliente/ordens` | Rastreabilidade das mudanças de estado. | Recorte |
| CAP-16 | Avaliações | `/cliente/avaliacoes` | Elegibilidade e histórico de avaliações. | Desktop |
| CAP-17 | Notificações | `/cliente/notificacoes` | Comunicação operacional. | Desktop ou recorte |
| CAP-18 | Central de ajuda e conversa | `/cliente/ajuda` | FAQ, destinatários e mensagens persistidas. | Desktop |
| CAP-19 | Perfil do cliente | `/cliente/perfil` | Dados da conta e opções de segurança. | Desktop |

### 5.3 Área do parceiro

| ID | Tela/estado | Rota | Evidência demonstrada | Formato |
| --- | --- | --- | --- | --- |
| CAP-20 | Dashboard do parceiro | `/parceiro/dashboard` | Ordens que exigem atenção e notificações. | Desktop |
| CAP-21 | Catálogo de serviços | `/parceiro/servicos` | Serviços ativos, preço-base e prazo. | Desktop |
| CAP-22 | Formulário de serviço | `/parceiro/servicos` | Cadastro e validações do catálogo. | Recorte |
| CAP-23 | Lista e detalhe de ordens | `/parceiro/ordens` | Isolamento e gestão das solicitações recebidas. | Desktop alto |
| CAP-24 | Diagnóstico e orçamento | `/parceiro/ordens` | Itens, quantidades e preços do orçamento. | Recorte |
| CAP-25 | Atualização de estado | `/parceiro/ordens` | Próximas ações permitidas pela política. | Recorte |
| CAP-26 | Notificações do parceiro | `/parceiro/notificacoes` | Eventos associados à assistência. | Desktop ou recorte |

### 5.4 Administração e páginas institucionais

| ID | Tela/estado | Rota | Evidência demonstrada | Formato |
| --- | --- | --- | --- | --- |
| CAP-27 | Credenciamento de parceiros | `/admin/parceiros` | Listagem e aprovação administrativa. | Desktop |
| CAP-28 | Política de privacidade | `/privacidade` | Transparência institucional. | Recorte opcional |
| CAP-29 | Termos de uso | `/termos` | Regras públicas da plataforma. | Recorte opcional |

CAP-28 e CAP-29 não devem ocupar espaço no corpo técnico se o conteúdo ainda precisar de revisão jurídica. Podem ser citadas sem imagem.

## 6. Conjunto recomendado para a monografia

Para evitar 29 figuras isoladas, recomenda-se selecionar aproximadamente 15 figuras finais, algumas compostas por duas ou três capturas relacionadas.

| Figura provisória | Composição | Capítulo/seção |
| --- | --- | --- |
| FIG-T01 | CAP-01 | Apresentação da solução. |
| FIG-T02 | CAP-03 e CAP-04 | Cadastro e autenticação. |
| FIG-T03 | CAP-06 | Dashboard do cliente. |
| FIG-T04 | CAP-07 e CAP-08 | Endereços e dispositivos. |
| FIG-T05 | CAP-10 e CAP-11 | Descoberta de assistências. |
| FIG-T06 | CAP-12 | Solicitação e triagem. |
| FIG-T07 | CAP-13 | Acompanhamento das ordens. |
| FIG-T08 | CAP-14 e CAP-15 | Orçamento e histórico. |
| FIG-T09 | CAP-16 e CAP-17 | Avaliações e notificações. |
| FIG-T10 | CAP-18 | Central de ajuda. |
| FIG-T11 | CAP-20 | Dashboard do parceiro. |
| FIG-T12 | CAP-21 e CAP-22 | Catálogo de serviços. |
| FIG-T13 | CAP-23 e CAP-24 | Gestão técnica e orçamento. |
| FIG-T14 | CAP-25 e CAP-26 | Estado e notificações. |
| FIG-T15 | CAP-27 | Credenciamento administrativo. |
| FIG-T16 | CAP-02 e versão mobile de CAP-06 ou CAP-10 | Responsividade. |

O conjunto poderá ser reduzido se duas figuras repetirem a mesma informação.

## 7. Roteiro de captura por história

### 7.1 História A - entrada e preparação do cliente

1. abrir página inicial sem sessão;
2. capturar proposta principal;
3. abrir cadastro sem enviar dados sensíveis;
4. abrir login;
5. autenticar como cliente principal;
6. abrir dashboard;
7. abrir endereços;
8. abrir dispositivos;
9. abrir o formulário de dispositivo sem salvar alteração.

### 7.2 História B - descoberta e solicitação

1. selecionar endereço principal;
2. escolher raio capaz de retornar parceiros sintéticos;
3. aguardar conclusão da geocodificação;
4. conferir nomes, distâncias e mapa;
5. selecionar uma assistência;
6. exibir serviços e avaliações;
7. iniciar solicitação com dispositivo da cliente principal;
8. preencher descrição fictícia coerente;
9. selecionar sintomas e checklist;
10. capturar antes do envio para não criar duplicata desnecessária.

### 7.3 História C - acompanhamento do cliente

1. abrir lista com diferentes estados;
2. selecionar ordem `quoted` para evidenciar decisão;
3. exibir diagnóstico, itens e total;
4. não aprovar nem cancelar durante a captura, salvo em banco descartável preparado para isso;
5. selecionar ordem `completed` para histórico e avaliação;
6. abrir notificações;
7. abrir central de ajuda e conversa com mensagens exclusivamente sintéticas.

### 7.4 História D - operação do parceiro

1. encerrar sessão do cliente;
2. autenticar como parceiro vinculado ao cenário escolhido;
3. abrir dashboard;
4. abrir catálogo;
5. abrir formulário sem modificar o cadastro;
6. abrir uma ordem compatível com o parceiro;
7. capturar orçamento existente ou formulário em ambiente descartável;
8. capturar ações permitidas para o estado atual;
9. abrir notificações.

### 7.5 História E - credenciamento

1. autenticar com conta de demonstração incluída em `ADMIN_USER_IDS`;
2. abrir a área administrativa;
3. confirmar que somente dados fictícios aparecem;
4. selecionar uma assistência sem alterar sua aprovação, salvo em ambiente descartável;
5. capturar a listagem e os controles administrativos.

## 8. Estados necessários

Antes de capturar, deve existir pelo menos uma ordem adequada para cada estado abaixo:

| Estado | Por que capturar |
| --- | --- |
| `pending` | Evidenciar solicitação aguardando diagnóstico. |
| `quoted` | Evidenciar decisão do cliente e orçamento. |
| `approved` | Demonstrar separação entre aprovação e início técnico. |
| `in_progress` | Demonstrar reparo em execução. |
| `waiting_parts` | Mostrar ramificação de espera por peças. |
| `ready` | Evidenciar ação de retirada. |
| `completed` | Demonstrar encerramento e avaliação. |

`cancelled` deve aparecer em lista ou histórico se houver dado demonstrativo apropriado. O seed atual não cria esse estado, portanto não se deve alterar uma ordem apenas para produzir uma imagem sem registrar essa preparação.

## 9. Conteúdo textual das figuras

### 9.1 Legendas

Modelo:

```text
Figura X - Busca de assistências técnicas por proximidade
Fonte: Elaborado pelos autores (2026).
```

O título deve descrever a função, não apenas repetir o nome da página.

### 9.2 Referência no corpo

Modelo:

> Conforme apresentado na Figura X, o cliente pode selecionar uma origem e um raio de busca. A aplicação exibe somente assistências aprovadas com localização válida, ordenadas pela distância geográfica aproximada.

Toda figura deverá ser mencionada antes ou imediatamente depois de sua inserção.

### 9.3 Texto alternativo de trabalho

Mesmo que o editor final não preserve texto alternativo no PDF, cada arquivo deve possuir uma descrição no inventário. Exemplo:

> Tela de busca com campo de localização, seletor de raio, mapa e lista de assistências ordenadas por distância.

## 10. Privacidade e segurança

### 10.1 Informações proibidas nas capturas

- senhas;
- arquivo `.env.local`;
- `DATABASE_URL`;
- `SESSION_SECRET`;
- tokens OAuth;
- chaves do Resend;
- cookies;
- console do navegador com cabeçalhos;
- arquivo de credenciais do seed;
- documentos, e-mails ou telefones reais;
- dados do banco que não pertençam ao conjunto sintético;
- barra do navegador contendo parâmetros sensíveis.

### 10.2 Tratamento de identificadores

UUIDs podem aparecer abreviados como número da ordem quando a interface já faz isso. UUID completo deve ser evitado se não tiver valor didático. Documentos fiscais sintéticos podem ser ocultados para reduzir ruído, mesmo não sendo reais.

### 10.3 Conversas

As mensagens demonstrativas devem conter texto neutro, como:

- "Olá, gostaria de confirmar se o diagnóstico já foi concluído.";
- "O orçamento está disponível na ordem para sua análise.";
- "O equipamento está pronto para retirada.".

Não inserir dados bancários, endereços particulares, números de documentos ou conteúdo pessoal.

## 11. Controle de consistência

Cada captura deverá ser registrada em uma planilha ou tabela de controle com:

| Campo | Exemplo |
| --- | --- |
| ID | CAP-14 |
| Arquivo | `figura-14-cliente-orcamento-2026-10-03.png` |
| Data | 3 de outubro de 2026 |
| Commit | SHA do código capturado |
| Resolução | 1440 x 900 |
| Perfil | Cliente sintético |
| Rota | `/cliente/ordens` |
| Estado | `quoted` |
| Requisitos | RF-28, RF-30 |
| Revisado | Sim/Não |
| Observações | Sem dados reais; total conferido. |

O SHA do commit é importante para relacionar as imagens à versão descrita na monografia.

## 12. Checklist antes de cada captura

- [ ] ambiente utiliza somente dados sintéticos;
- [ ] usuário e papel corretos;
- [ ] rota e estado correspondem ao roteiro;
- [ ] página terminou de carregar;
- [ ] não há alerta ou erro inesperado;
- [ ] não há dados sensíveis;
- [ ] textos e valores estão coerentes;
- [ ] zoom e resolução seguem o padrão;
- [ ] cursor não cobre conteúdo;
- [ ] menus necessários estão visíveis;
- [ ] imagem tem finalidade acadêmica definida;
- [ ] nome do arquivo segue o padrão.

## 13. Checklist de seleção para o documento

- [ ] a figura foi citada no texto;
- [ ] a legenda descreve a funcionalidade;
- [ ] a fonte está indicada;
- [ ] o conteúdo continua legível em A4;
- [ ] não repete informação de figura anterior;
- [ ] demonstra requisito implementado;
- [ ] não sugere recurso futuro como entregue;
- [ ] utiliza interface correspondente ao commit registrado;
- [ ] passou por revisão visual depois da exportação para PDF.

## 14. Estrutura de diretórios sugerida

```text
docs/
└── monografia/
    └── figuras/
        ├── originais/
        │   ├── publico/
        │   ├── cliente/
        │   ├── parceiro/
        │   └── admin/
        ├── compostas/
        └── diagramas/
```

Os originais não devem ser sobrescritos. Figuras compostas e versões finais ficam em diretório separado.

## 15. Critérios para iniciar a captura

A etapa visual pode começar quando:

1. `db:migrate`, `db:check` e validação do seed forem aprovados;
2. a aplicação iniciar sem erro;
3. as contas de cliente, parceiro e administrador estiverem disponíveis;
4. forem confirmados os vínculos das ordens selecionadas;
5. nenhuma informação real estiver misturada ao banco demonstrativo;
6. o commit de referência estiver definido;
7. a lista de figuras do corpo estiver aprovada.

## 16. Resultado da Parte 5

A documentação visual passa a ter:

- ambiente demonstrativo identificado;
- narrativa coerente entre perfis;
- 29 capturas candidatas;
- conjunto recomendado de aproximadamente 16 figuras finais;
- padrões de resolução, formato e nomenclatura;
- roteiro operacional por história;
- regras de segurança e privacidade;
- critérios de seleção e rastreabilidade.

O próximo passo é a Parte 6: validar tecnicamente o projeto por meio de testes, lint, build e verificações do banco, registrando resultados que possam ser citados na monografia.
