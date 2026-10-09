# SmartFix - Parte 2: estrutura definitiva da monografia

**Data:** 3 de outubro de 2026  
**Objetivo:** definir a estrutura editorial da nova monografia e mapear o destino de cada parte do documento de 2025.  
**Base utilizada:** manual institucional de 2025, monografia atual do SmartFix, inventario tecnico da Parte 1 e estado do repositorio em outubro de 2026.

## 1. Decisao estrutural

A nova versao sera organizada como monografia, e nao como relatorio tecnico ou artigo. A macroestrutura seguira o manual da faculdade:

1. elementos pre-textuais;
2. introducao;
3. desenvolvimento;
4. consideracoes finais;
5. elementos pos-textuais.

Dentro do desenvolvimento, serao usados capitulos proprios para fundamentacao, metodologia, especificacao, desenvolvimento e validacao. Essa divisao torna o texto tecnico compreensivel sem contrariar a estrutura institucional.

## 2. Sumario proposto

Os numeros de pagina somente serao adicionados quando o documento estiver diagramado.

```text
1 INTRODUCAO
  1.1 Contextualizacao
  1.2 Problema de pesquisa
  1.3 Justificativa
  1.4 Objetivo geral
  1.5 Objetivos especificos
  1.6 Delimitacao e escopo do trabalho
  1.7 Organizacao da monografia

2 FUNDAMENTACAO E CONTEXTO DO PROBLEMA
  2.1 Manutencao de dispositivos eletronicos
  2.2 Relacionamento entre clientes e assistencias tecnicas
  2.3 Transparencia no ciclo de reparo
  2.4 Plataformas web responsivas e marketplaces de servicos
  2.5 Localizacao e descoberta de prestadores
  2.6 Seguranca, privacidade e protecao de dados
  2.7 Trabalhos e solucoes relacionados

3 METODOLOGIA
  3.1 Natureza e abordagem do trabalho
  3.2 Levantamento e revisao dos requisitos
  3.3 Desenvolvimento incremental
  3.4 Modelagem do sistema e do banco de dados
  3.5 Tecnologias e ambiente de desenvolvimento
  3.6 Estrategia de testes e validacao
  3.7 Controle de versoes e rastreabilidade

4 ESPECIFICACAO DO SMARTFIX
  4.1 Visao geral da solucao
  4.2 Perfis de usuario
    4.2.1 Cliente
    4.2.2 Assistencia tecnica parceira
    4.2.3 Administrador
  4.3 Escopo da versao atual
  4.4 Funcionalidades planejadas para evolucoes futuras
  4.5 Requisitos funcionais
    4.5.1 Cadastro, autenticacao e conta
    4.5.2 Enderecos e dispositivos
    4.5.3 Descoberta de assistencias
    4.5.4 Solicitacao e triagem do reparo
    4.5.5 Diagnostico, orcamento e acompanhamento
    4.5.6 Notificacoes, suporte e avaliacoes
    4.5.7 Operacoes do parceiro
    4.5.8 Operacoes administrativas
  4.6 Requisitos nao funcionais
  4.7 Regras de negocio
  4.8 Matriz de rastreabilidade

5 MODELAGEM E ARQUITETURA
  5.1 Visao arquitetural
  5.2 Diagrama de casos de uso
  5.3 Diagrama de atividades
  5.4 Diagramas de sequencia
  5.5 Diagrama de estados da ordem de servico
  5.6 Diagrama de classes ou modelo de dominio
  5.7 Diagrama de componentes
  5.8 Diagrama de implantacao
  5.9 Modelo entidade-relacionamento
  5.10 Dicionario de dados
  5.11 Seguranca e controle de acesso

6 DESENVOLVIMENTO E IMPLEMENTACAO
  6.1 Organizacao do repositorio
  6.2 Interface web com Next.js e React
  6.3 APIs e camada de servidor
  6.4 Validacao de dados e tratamento de erros
  6.5 Persistencia com PostgreSQL e Sequelize
  6.6 Autenticacao, sessao e autorizacao
  6.7 Descoberta geografica de assistencias
  6.8 Fluxo da ordem de servico
  6.9 Notificacoes e suporte por mensagens
  6.10 Interfaces do cliente
    6.10.1 Pagina inicial, cadastro e login
    6.10.2 Dashboard e perfil
    6.10.3 Enderecos e dispositivos
    6.10.4 Busca de assistencias
    6.10.5 Solicitacao e acompanhamento de reparos
    6.10.6 Avaliacoes, notificacoes e ajuda
  6.11 Interfaces da assistencia tecnica
    6.11.1 Dashboard
    6.11.2 Catalogo de servicos
    6.11.3 Gestao das ordens de servico
    6.11.4 Notificacoes
  6.12 Interface administrativa
  6.13 Configuracao e execucao do sistema

7 TESTES, RESULTADOS E DISCUSSAO
  7.1 Ambiente de validacao
  7.2 Testes automatizados
  7.3 Verificacao estatica e build de producao
  7.4 Verificacao do banco de dados
  7.5 Validacao dos fluxos por perfil
  7.6 Resultados alcancados
  7.7 Comparacao entre requisitos e implementacao
  7.8 Limitacoes da versao atual

8 CONSIDERACOES FINAIS
  8.1 Atendimento aos objetivos
  8.2 Contribuicoes do trabalho
  8.3 Limitacoes
  8.4 Trabalhos futuros

REFERENCIAS

APENDICE A - REQUISITOS FUNCIONAIS COMPLETOS
APENDICE B - REQUISITOS NAO FUNCIONAIS COMPLETOS
APENDICE C - REGRAS DE NEGOCIO
APENDICE D - MATRIZ DE RASTREABILIDADE
APENDICE E - ROTAS DA API
APENDICE F - DICIONARIO DE DADOS
APENDICE G - ROTEIRO DE INSTALACAO E EXECUCAO
APENDICE H - ROTEIROS DE TESTE
```

## 3. Elementos pre-textuais

### 3.1 Capa

**Acao:** atualizar.

Devera conter instituicao, autores, titulo, subtitulo se houver, cidade e ano conforme o modelo do manual. O titulo atual pode ser mantido provisoriamente:

> SMARTFIX: ENGENHARIA DE SOFTWARE APLICADA NA CRIACAO DE UMA PLATAFORMA WEB PARA GERENCIAMENTO E ACOMPANHAMENTO DE REPAROS DE DISPOSITIVOS ELETRONICOS

O uso de "plataforma web" substitui a descricao antiga de aplicativo movel.

### 3.2 Folha de rosto

**Acao:** atualizar.

Sera preservada a natureza academica do trabalho, atualizando titulo, ano, orientacao e demais dados institucionais que forem confirmados.

### 3.3 Folha de aprovacao

**Acao:** preservar o modelo e deixar campos institucionais editaveis.

Nao serao inventados nomes da banca, datas ou assinaturas.

### 3.4 Dedicatoria, agradecimentos e epigrafe

**Acao:** manter apenas se os autores desejarem.

O conteudo atual pode ser reaproveitado depois de revisao coletiva. Esses elementos nao receberao conteudo tecnico.

### 3.5 Resumo

**Acao:** reescrever integralmente ao final.

O novo resumo devera sintetizar:

- problema;
- objetivo;
- metodologia;
- arquitetura principal;
- funcionalidades entregues;
- forma de validacao;
- resultados;
- principais limitacoes.

Pagamento, logistica e aplicativo nativo nao devem aparecer como resultados entregues.

### 3.6 Abstract

**Acao:** traduzir somente depois da aprovacao do resumo em portugues.

Isso evita manter divergencias entre as duas versoes.

### 3.7 Listas

**Acao:** gerar automaticamente na diagramacao final.

Listas previstas:

- lista de figuras;
- lista de tabelas;
- lista de quadros;
- lista de abreviaturas e siglas.

Siglas provaveis: API, CSS, DER, HTTP, LGPD, MVP, OAuth, ORM, PWA, RF, RNF, RLS, SQL, TLS e UML. Somente siglas realmente utilizadas permanecerao na lista final.

### 3.8 Sumario

**Acao:** gerar automaticamente a partir dos estilos do documento.

Nao devera ser digitado manualmente. A numeracao e os titulos precisam coincidir integralmente com o corpo do trabalho.

## 4. Mapa da monografia antiga para a nova

| Conteudo da versao atual | Destino | Acao | Motivo |
| --- | --- | --- | --- |
| Capa e folha de rosto | Pre-textuais | Atualizar | Titulo e natureza tecnologica mudaram. |
| Folha de aprovacao | Pre-textuais | Preservar modelo | Dados dependem da instituicao e banca. |
| Dedicatoria e epigrafe | Pre-textuais | Revisar | Conteudo autoral ainda pode ser aproveitado. |
| Resumo, abstract e resumen | Pre-textuais | Reescrever | Descrevem a versao movel e funcionalidades antigas. |
| Introducao | Capitulo 1 | Reescrever com aproveitamento conceitual | Problema continua valido, mas produto e resultados mudaram. |
| Cenario das assistencias tecnicas | Capitulo 2 | Atualizar e fundamentar | Precisa de referencias recentes e distincao entre contexto e opiniao. |
| Desafios do setor | Capitulos 1 e 2 | Manter com revisao | Sustenta justificativa e problema de pesquisa. |
| Inovacao de servicos | Capitulo 2 | Reestruturar | Deve apoiar a proposta web atual. |
| Trabalhos correlatos | Secao 2.7 | Reescrever | Comparacao precisa de fontes verificaveis e criterios explicitos. |
| Apresentacao do SmartFix | Capitulos 4 e 6 | Reescrever | O produto atual e muito mais amplo e diferente do prototipo antigo. |
| Objetivos do sistema | Secoes 1.4, 1.5 e 4.1 | Revisar | Separar objetivo academico de funcionalidades do produto. |
| Funcionalidades | Capitulo 4 | Substituir | Usar o inventario confirmado na Parte 1. |
| Caso de uso | Secao 5.2 | Recriar | Atores e funcionalidades mudaram. |
| Requisitos funcionais | Secao 4.5 e Apendice A | Recriar | Lista antiga mistura recursos atuais e futuros. |
| Requisitos nao funcionais | Secao 4.6 e Apendice B | Recriar | Devem ser testaveis e sustentados por evidencia. |
| Requisitos de negocio | Secao 4.7 e Apendice C | Recriar | Fluxo real possui regras de estado e autorizacao precisas. |
| Modelagem conceitual do banco | Secoes 5.9 e 5.10 | Substituir | Schema atual possui entidades e relacionamentos novos. |
| Diagramas comportamentais | Secoes 5.2 a 5.5 | Recriar | Devem refletir os fluxos web implementados. |
| Diagramas estruturais | Secoes 5.6 a 5.8 | Recriar | Arquitetura Flutter/Kotlin nao existe mais. |
| Prototipos de interface | Secoes 6.10 a 6.12 | Substituir por telas reais | A aplicacao atual tem interfaces funcionais. |
| Arquitetura tecnica | Capitulo 5 e secoes 6.1 a 6.9 | Reescrever integralmente | Stack atual e Next.js, React, TypeScript e PostgreSQL. |
| Metodologia de validacao | Capitulos 3 e 7 | Ampliar | Agora existem testes, lint, build e verificacoes do banco. |
| Resultados e discussoes | Capitulo 7 | Criar como secao robusta | A versao antiga mistura descricao e avaliacao. |
| Conclusao | Capitulo 8 | Reescrever ao final | Deve responder aos objetivos atualizados. |
| Referencias | Pos-textual | Auditar e atualizar | Manter apenas obras citadas e incluir fontes novas. |

## 5. Conteudo previsto por capitulo

### Capitulo 1 - Introducao

**Finalidade:** apresentar o problema, a relevancia, os objetivos e os limites do trabalho.

**Deve responder:**

- qual problema motivou o SmartFix;
- quem e afetado;
- por que uma plataforma web e pertinente;
- qual pergunta orienta o trabalho;
- o que foi construido;
- o que ficou fora da versao atual.

**Pergunta de pesquisa provisoria:**

> Como uma plataforma web pode centralizar e tornar mais transparente o relacionamento entre clientes e assistencias tecnicas durante o ciclo de reparo de dispositivos eletronicos?

**Objetivo geral provisório:**

> Desenvolver e avaliar uma plataforma web responsiva para organizar a solicitacao, o diagnostico, o orcamento e o acompanhamento de reparos realizados por assistencias tecnicas parceiras.

**Fontes internas:** README e inventario da Parte 1.  
**Fontes externas:** dados de mercado, literatura sobre servicos digitais, transparencia e experiencia do usuario.

### Capitulo 2 - Fundamentacao e contexto

**Finalidade:** dar sustentacao teorica ao problema e as escolhas da solucao.

Nao deve ser uma descricao do codigo. Cada secao precisa de referencias bibliograficas. Os dados do mercado devem ter fonte, periodo, localidade e metodologia claramente identificados.

**Ponto de atencao:** o texto antigo apresenta afirmacoes amplas sobre o setor. Elas so permanecerao se forem sustentadas por fontes confiaveis.

### Capitulo 3 - Metodologia

**Finalidade:** explicar como o trabalho foi conduzido e como seus resultados foram avaliados.

Estrutura sugerida:

- pesquisa aplicada;
- abordagem qualitativa e descritiva, complementada por evidencias quantitativas dos testes;
- levantamento documental e analise do dominio;
- desenvolvimento incremental;
- modelagem UML e relacional;
- implementacao por camadas;
- testes automatizados, verificacao estatica e build;
- rastreabilidade entre requisitos, codigo e testes.

**Ponto de atencao:** Scrum, Kanban ou outra metodologia so sera afirmada se houver evidencia de uso real. Ferramentas do GitHub podem ser descritas como apoio, sem transformar uso informal em metodologia formal.

### Capitulo 4 - Especificacao do SmartFix

**Finalidade:** documentar o que o sistema deve fazer e quais regras governam seu comportamento.

Este capitulo usara a Parte 1 como base e separara:

- escopo entregue;
- funcionalidades condicionais;
- funcionalidades parciais;
- trabalhos futuros.

Os requisitos completos ficarao nos apendices; o corpo apresentara agrupamentos e os requisitos mais importantes. Isso evita transformar o capitulo em uma sequencia extensa de tabelas.

### Capitulo 5 - Modelagem e arquitetura

**Finalidade:** explicar a solucao antes de apresentar detalhes de codigo e telas.

Diagramas previstos:

1. casos de uso geral;
2. atividade da solicitacao de reparo;
3. sequencia de cadastro/autenticacao;
4. sequencia de solicitacao e orcamento;
5. sequencia de busca geografica;
6. estados da ordem de servico;
7. modelo de dominio;
8. componentes;
9. implantacao;
10. DER.

Cada diagrama sera acompanhado de interpretacao textual. Diagramas nao serao inseridos apenas como ilustracao.

### Capitulo 6 - Desenvolvimento e implementacao

**Finalidade:** demonstrar como a solucao foi construida e como o usuario interage com ela.

O capitulo combinara explicacoes tecnicas com figuras das telas. Nao sera incluido codigo-fonte extenso; pequenos trechos so aparecerao quando forem essenciais para explicar uma regra ou decisao.

Padrao para cada grupo de telas:

1. objetivo da interface;
2. usuario autorizado;
3. dados apresentados ou coletados;
4. validacoes relevantes;
5. efeito no fluxo do sistema;
6. figura com legenda e fonte.

### Capitulo 7 - Testes, resultados e discussao

**Finalidade:** apresentar evidencia de que a solucao funciona dentro do escopo declarado.

Resultados previstos:

- testes automatizados executados;
- resultado do lint;
- resultado do build;
- verificacao do schema;
- validacao manual dos principais fluxos;
- rastreabilidade de requisitos;
- limitacoes encontradas.

Resultados ainda nao executados nao serao antecipados. Este capitulo sera finalizado somente depois da etapa de validacao.

### Capitulo 8 - Consideracoes finais

**Finalidade:** responder diretamente ao problema e aos objetivos.

Nao devera introduzir tecnologias ou resultados novos. Trabalhos futuros previstos:

- pagamento integrado;
- coleta e entrega;
- interfaces completas de atendimento administrativo e do parceiro;
- relatorios administrativos;
- moderacao;
- upload estruturado de midias;
- eventual instalacao como PWA;
- testes de desempenho, acessibilidade e usabilidade com participantes.

## 6. Plano de figuras e tabelas

### 6.1 Figuras de modelagem

| Codigo provisório | Figura | Origem |
| --- | --- | --- |
| F1 | Visao geral dos atores e casos de uso | Novo diagrama |
| F2 | Atividade da solicitacao de reparo | Novo diagrama |
| F3 | Sequencia de autenticacao | Novo diagrama |
| F4 | Sequencia de solicitacao, diagnostico e orcamento | Novo diagrama |
| F5 | Sequencia de descoberta geografica | Novo diagrama |
| F6 | Estados da ordem de servico | Novo diagrama |
| F7 | Modelo de dominio | Novo diagrama |
| F8 | Arquitetura de componentes | Novo diagrama |
| F9 | Implantacao da plataforma | Novo diagrama |
| F10 | Modelo entidade-relacionamento | Schema atual |

### 6.2 Capturas da interface

| Grupo | Capturas previstas |
| --- | --- |
| Acesso | pagina inicial, cadastro, login e recuperacao de senha |
| Cliente | dashboard, perfil, enderecos e dispositivos |
| Descoberta | busca, mapa, perfil da assistencia, servicos e avaliacoes |
| Reparo | solicitacao, lista de ordens, detalhe, orcamento e historico |
| Relacionamento | notificacoes, avaliacoes e central de ajuda |
| Parceiro | dashboard, servicos, ordens, diagnostico/orcamento e notificacoes |
| Administracao | listagem e aprovacao de parceiros |

Telas semelhantes poderao ser agrupadas em uma unica figura composta. A quantidade final devera favorecer legibilidade, nao volume.

### 6.3 Tabelas e quadros

- comparacao entre processo tradicional e processo apoiado pelo SmartFix;
- tecnologias utilizadas e respectivas funcoes;
- requisitos funcionais resumidos;
- requisitos nao funcionais e forma de verificacao;
- regras de transicao da ordem;
- entidades e responsabilidades;
- matriz de testes e resultados;
- comparacao entre escopo planejado e entregue.

## 7. Apendices e anexos

Os materiais produzidos pelos autores serao identificados como apendices. Materiais de terceiros, caso realmente necessarios, serao anexos.

### Apendices recomendados

- requisitos completos;
- regras de negocio;
- matriz de rastreabilidade;
- catalogo de APIs;
- dicionario de dados;
- roteiro de instalacao;
- casos ou roteiros de teste.

### Materiais que nao devem ser anexados integralmente

- codigo-fonte completo;
- README completo;
- arquivos SQL completos;
- grandes capturas de logs;
- copias extensas de documentacao oficial.

Esses materiais podem ser referenciados no repositorio e sintetizados nos apendices.

## 8. Referencias a levantar

A bibliografia final devera combinar fontes academicas, normativas, legais e tecnicas.

### Eixos academicos

- engenharia de software;
- requisitos e rastreabilidade;
- arquitetura de sistemas web;
- experiencia do usuario;
- marketplaces e plataformas de servicos;
- manutencao de dispositivos e economia circular, se pertinente ao texto.

### Normas e legislacao

- normas ABNT exigidas no manual;
- Lei Geral de Protecao de Dados Pessoais;
- legislacao de comercio e servicos aplicavel somente quando relacionada ao escopo;
- Lei nº 15.211/2025 somente se a analise demonstrar pertinencia efetiva.

### Documentacao tecnica oficial

- Next.js;
- React;
- TypeScript;
- Node.js;
- PostgreSQL;
- Sequelize;
- Zod;
- Supabase;
- Leaflet;
- OpenStreetMap e Photon;
- OAuth 2.0 e praticas de seguranca aplicaveis.

Versoes de ferramentas devem ser confirmadas no repositorio e fontes tecnicas devem ser citadas apenas quando efetivamente utilizadas na explicacao.

## 9. Estimativa editorial

Estimativa inicial, sujeita a revisao depois das figuras:

| Bloco | Faixa estimada |
| --- | --- |
| Elementos pre-textuais | 8 a 12 paginas |
| Introducao | 4 a 6 paginas |
| Fundamentacao | 8 a 12 paginas |
| Metodologia | 5 a 7 paginas |
| Especificacao | 8 a 12 paginas |
| Modelagem e arquitetura | 10 a 15 paginas |
| Desenvolvimento e interfaces | 15 a 25 paginas |
| Testes e resultados | 6 a 10 paginas |
| Consideracoes finais | 3 a 5 paginas |
| Referencias e apendices | variavel |

A meta nao e aumentar artificialmente a quantidade de paginas. Diagramas, capturas e tabelas so permanecerao quando contribuirem para explicar ou comprovar o trabalho.

## 10. Ordem de redacao

A ordem de producao nao sera a mesma do sumario:

1. corrigir e consolidar requisitos e regras de negocio;
2. produzir a matriz de rastreabilidade;
3. atualizar o DER e os diagramas;
4. escrever especificacao, modelagem e arquitetura;
5. documentar implementacao e interfaces;
6. executar testes e registrar resultados;
7. escrever metodologia com base no processo efetivamente realizado;
8. revisar fundamentacao e referencias externas;
9. escrever introducao;
10. escrever consideracoes finais;
11. produzir resumo e abstract;
12. gerar listas, sumario e paginacao.

Essa ordem evita que a introducao, o resumo ou a conclusao prometam resultados diferentes do que foi efetivamente documentado e validado.

## 11. Criterios de conclusao da Parte 2

A estrutura editorial fica aprovada quando:

- o trabalho estiver caracterizado como monografia;
- os elementos exigidos pelo manual estiverem contemplados;
- todos os capitulos tiverem finalidade definida;
- cada parte da monografia antiga possuir um destino;
- funcionalidades futuras estiverem separadas das entregues;
- figuras, tabelas e apendices previstos tiverem funcao clara;
- a ordem de producao estiver definida.

## 12. Proximo passo

A Parte 3 sera a revisao dos requisitos e regras de negocio. Ela devera produzir:

1. catalogo atualizado de requisitos funcionais;
2. catalogo atualizado de requisitos nao funcionais;
3. regras de negocio formalizadas;
4. criterios de aceite;
5. matriz inicial de rastreabilidade entre requisito, interface, API, persistencia e teste.
