# SmartFix - Parte 6: validação técnica

**Data da execução:** 3 de outubro de 2026  
**Commit de referência:** `ea44e5ed1cc4e53f7b8e389ec8bfc97ad0ddf534` (`ea44e5e`)  
**Branch:** `main`  
**Objetivo:** registrar evidências reproduzíveis de qualidade, compilação, persistência e integridade da versão atual do SmartFix.

## 1. Ambiente de validação

| Componente | Versão/quantidade |
| --- | --- |
| Sistema operacional | Windows |
| Node.js | 24.19.0 |
| npm | 11.17.0 |
| Next.js | 16.3.4 |
| React | 19.2.8 |
| TypeScript | 5.9.3 |
| ESLint | 9.39.5 |
| Arquivos de testes | 16 |
| Route Handlers de API | 34 |
| Páginas da aplicação | 23 |
| Migrations SQL | 8 |

O ambiente possuía arquivo `.env.local` e conexão PostgreSQL funcional. Nenhum valor de configuração ou credencial foi incluído neste relatório.

## 2. Resumo executivo

| Verificação | Resultado | Evidência resumida |
| --- | --- | --- |
| Testes automatizados | Aprovado | 42 executados, 42 aprovados, 0 falhas. |
| ESLint | Aprovado | Processo encerrado com código 0 e sem diagnóstico. |
| Build de produção | Aprovado | Compilação, TypeScript, geração estática e otimização concluídas. |
| Compatibilidade do schema | Aprovado | Oito modelos/tabelas principais compatíveis. |
| RLS | Aprovado | Nove tabelas verificadas com RLS ativo. |
| Acesso do servidor | Aprovado | Nove tabelas acessíveis pela conexão do servidor. |
| Smoke test PostgreSQL | Aprovado | CRUD, FKs, cascatas, propriedade, orçamento e avaliação validados. |
| Bloqueio de papéis públicos | Aprovado | Acesso direto dos papéis `anon` e `authenticated` bloqueado. |
| Integridade dos dados demo | Aprovado | Nenhuma inconsistência detectada no conjunto semeado. |

## 3. Testes automatizados

### 3.1 Comando

```powershell
npm test
```

### 3.2 Resultado

```text
tests: 42
pass: 42
fail: 0
cancelled: 0
skipped: 0
todo: 0
duration: 14025,9037 ms
```

Todos os testes foram aprovados. A duração observada foi de aproximadamente 14 segundos nesse ambiente, sem pretensão de representar benchmark de desempenho.

### 3.3 Cobertura funcional observada

| Grupo | Evidências aprovadas |
| --- | --- |
| Endereços | Bloqueio de exclusão do principal, permanência de ao menos um endereço, normalização e validação. |
| Respostas de API | Leitura de JSON, tratamento de HTML inesperado e JSON malformado. |
| Autenticação | Cadastro válido, confirmação de senha, documentos/contatos inválidos e limites de senha. |
| Models | Mapeamento de endereço e dispositivo para o schema atual. |
| Dashboards | Priorização de pendências e estados vazios sem métricas fictícias. |
| Banco ausente | Impede simulação indevida de persistência PostgreSQL. |
| Dispositivos | Catálogo, foto, tipo do problema e limites de entrada. |
| Descoberta | Distância, raio, geocodificação, cache, aprovação e isolamento de endereço. |
| Ordens | Orçamento, propriedade, papéis, transições e avaliação. |
| Segurança de entrada | Rejeição de valores inválidos e campos privilegiados. |
| OAuth | Rejeição de estado adulterado ou expirado. |
| Cadastro integrado | Persistência separada do endereço de cliente e parceiro. |
| Rascunho de reparo | Preservação, prioridade de seleção e descarte de conteúdo inválido. |
| Criptografia e sessão | bcrypt, atualização de hash legado, assinatura e rejeição de token adulterado. |
| Workflow integrado | Persistência, isolamento, aprovação, triagem, orçamento, notificações, perfil e recuperação. |

### 3.4 Interpretação

A suíte demonstra comportamento e regras relevantes, mas não representa cobertura integral de todas as linhas ou interfaces. Em especial, ainda faltam testes dedicados de catálogo de serviços, conversas de suporte e responsividade visual.

## 4. Análise estática

### 4.1 Comando

```powershell
npm run lint
```

### 4.2 Resultado

O ESLint analisou `app`, `src`, `tests` e `next.config.ts`. O processo terminou com código 0 e não emitiu erros ou avisos.

### 4.3 Interpretação

O resultado comprova conformidade com as regras estáticas configuradas no projeto. Não comprova, isoladamente, ausência de defeitos funcionais ou vulnerabilidades.

## 5. Build de produção

### 5.1 Comando

```powershell
npm run build
```

### 5.2 Resultado

O build do Next.js 16.3.4 foi concluído com código 0:

- compilação otimizada concluída em aproximadamente 10 segundos;
- verificação TypeScript concluída em aproximadamente 5,8 segundos;
- coleta de dados das páginas concluída;
- 34 unidades de geração estática processadas;
- otimização final concluída;
- rotas estáticas e dinâmicas reconhecidas.

### 5.3 Rotas compiladas

Foram identificados 34 arquivos de Route Handler e 23 arquivos de página. O build incluiu:

- páginas públicas;
- autenticação e recuperação;
- área do cliente;
- área do parceiro;
- credenciamento administrativo;
- APIs de conta, endereços, dispositivos, ordens, parceiros, serviços, notificações e suporte.

### 5.4 Interpretação

O resultado demonstra que o código atual compila para produção e satisfaz a verificação de tipos executada pelo build. Não comprova que todos os serviços externos estejam configurados no ambiente de implantação.

## 6. Verificação do schema

### 6.1 Comando

```powershell
npm run db:check
```

### 6.2 Compatibilidade confirmada

O comando confirmou compatibilidade para:

1. `clients`;
2. `client_addresses`;
3. `devices`;
4. `partner`;
5. `partner_services`;
6. `repair_orders`;
7. `reviews`;
8. `workflow_records`.

### 6.3 RLS e acesso do servidor

| Tabela | RLS | Acesso do servidor |
| --- | --- | --- |
| `client_addresses` | Ativo | Confirmado |
| `clients` | Ativo | Confirmado |
| `devices` | Ativo | Confirmado |
| `partner` | Ativo | Confirmado |
| `partner_services` | Ativo | Confirmado |
| `repair_orders` | Ativo | Confirmado |
| `reviews` | Ativo | Confirmado |
| `support_messages` | Ativo | Confirmado |
| `workflow_records` | Ativo | Confirmado |

### 6.4 Interpretação

A aplicação acessa o banco pela conexão do servidor, enquanto RLS permanece habilitada. Essa verificação sustenta a descrição arquitetural de que o navegador não consulta diretamente as tabelas.

## 7. Smoke test PostgreSQL

### 7.1 Comando

```powershell
npm run db:smoke
```

### 7.2 Resultado

O teste confirmou:

- criação, consulta, atualização e exclusão dentro de transação;
- endereços de cliente e parceiro;
- isolamento por proprietário;
- persistência da ordem;
- orçamento e total estimado;
- avaliação somente em ordem concluída;
- uma avaliação por ordem;
- chaves estrangeiras;
- restrições de nota;
- cascatas e exclusões restritas;
- bloqueio de endereço sem proprietário ou com dois proprietários;
- bloqueio de acesso direto pelos papéis públicos `anon` e `authenticated`.

Mensagem final registrada:

```text
DER: CRUD, endereços, ordens, orçamento, avaliação única, propriedade, FKs e cascatas: OK.
Acesso direto anon: bloqueado.
Acesso direto authenticated: bloqueado.
Teste PostgreSQL concluído. Todos os dados de teste foram revertidos.
```

O smoke test utiliza transação e executa rollback ao final. Nenhuma fixture temporária permaneceu no banco.

## 8. Verificação dos dados demonstrativos

### 8.1 Comando

```powershell
node scripts/seed-demo.cjs --check
```

### 8.2 Contagens observadas no banco

| Tabela | Registros observados |
| --- | ---: |
| `clients` | 17 |
| `partner` | 16 |
| `client_addresses` | 93 |
| `devices` | 31 |
| `partner_services` | 60 |
| `repair_orders` | 60 |
| `reviews` | 21 |

O verificador retornou `Integridade: OK` para o conjunto identificado pelo seed.

### 8.3 Observação para as capturas

O banco contém registros além da carga demonstrativa esperada: dois clientes, um parceiro, três endereços e um dispositivo adicionais. Não foi estabelecido que esses registros extras sejam sintéticos. Portanto, a etapa de capturas deve utilizar uma destas alternativas:

1. banco isolado criado exclusivamente para a monografia; ou
2. comprovação prévia de que toda informação exibida pertence ao seed sintético.

A primeira alternativa é a mais segura. Nenhum registro extra será excluído automaticamente.

## 9. Rastreabilidade com requisitos não funcionais

| Requisito | Evidência desta etapa | Resultado |
| --- | --- | --- |
| RNF-01 - bcrypt | Testes de hash e senha incorreta. | Atendido |
| RNF-02 - sessão assinada | Testes de token válido, adulterado e malformado. | Atendido |
| RNF-03 - autorização | Testes de proprietário, papel e isolamento. | Atendido no escopo testado |
| RNF-04 - validação | Testes de schemas e entradas inválidas. | Atendido no escopo testado |
| RNF-05 - banco apenas pelo servidor | Arquitetura e bloqueio dos papéis públicos. | Atendido |
| RNF-06 - RLS | `db:check` confirmou RLS nas nove tabelas. | Atendido no banco verificado |
| RNF-07 - integridade | Smoke test de FKs, checks, cascatas e transação. | Atendido no escopo testado |
| RNF-08 - isolamento | Testes unitários, integrados e smoke test. | Atendido no escopo testado |
| RNF-09 - erros controlados | Testes de resposta inválida da API. | Atendido no escopo testado |
| RNF-10 - responsividade | Não medida nesta etapa. | Pendente de inspeção visual |
| RNF-11 - manutenibilidade | Estrutura e build aprovados. | Evidência parcial |
| RNF-12 - pipeline de qualidade | Testes, lint e build aprovados. | Atendido nesta execução |
| RNF-13 - histórico | Testes de workflow e ordem. | Atendido no escopo testado |
| RNF-14 - falha controlada de integrações | Testes e controllers tratam indisponibilidade. | Atendido parcialmente |

## 10. O que esta validação não comprova

Os resultados não devem ser extrapolados para afirmar:

- disponibilidade 24 horas por dia;
- desempenho inferior a três segundos em qualquer rede;
- capacidade para número indefinido de usuários;
- escalabilidade automática;
- conformidade integral com WCAG;
- segurança absoluta;
- funcionamento de Google OAuth sem credenciais válidas;
- envio de e-mail sem provedor configurado;
- implantação pública em produção;
- compatibilidade com todos os navegadores e dispositivos;
- ausência total de defeitos.

Essas propriedades exigem testes ou evidências adicionais.

## 11. Texto-base para a monografia

> A validação técnica foi executada em 3 de outubro de 2026 sobre o commit `ea44e5e`. A suíte automatizada executou 42 casos, todos aprovados, sem testes ignorados ou cancelados. A análise estática com ESLint e o build de produção do Next.js foram concluídos sem erros. Em banco PostgreSQL configurado, a verificação de schema confirmou a compatibilidade dos modelos e a ativação de Row Level Security nas nove tabelas avaliadas. O teste transacional de integração validou operações CRUD, restrições de propriedade, chaves estrangeiras, orçamento, unicidade de avaliação e bloqueio de acesso direto pelos papéis públicos, revertendo os dados temporários ao final.

Esse parágrafo pode ser utilizado como base, mas os detalhes e limitações apresentados neste relatório devem acompanhar a discussão dos resultados.

## 12. Evidências recomendadas no documento final

| Evidência | Forma recomendada |
| --- | --- |
| Resultado dos testes | Tabela resumida com 42/42. |
| Lint e build | Quadro com comando, resultado e data. |
| Schema e RLS | Tabela de nove tabelas. |
| Smoke test | Síntese das propriedades verificadas. |
| Logs completos | Não inserir integralmente; preservar como material de trabalho. |
| Versões | Tabela do ambiente. |
| Limitações | Subseção textual explícita. |

## 13. Resultado da Parte 6

A versão analisada apresentou:

- 42 de 42 testes automatizados aprovados;
- lint aprovado sem diagnósticos;
- build de produção aprovado;
- TypeScript aprovado pelo build;
- schema compatível;
- RLS ativo nas nove tabelas verificadas;
- smoke test PostgreSQL aprovado com rollback;
- integridade do conjunto demonstrativo aprovada;
- nenhuma falha nos comandos executados.

O próximo passo é a Parte 7: iniciar a redação acadêmica, começando pela especificação e descrição técnica do SmartFix com base nas evidências já consolidadas.
