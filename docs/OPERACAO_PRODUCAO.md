# Operação do SmartFix em produção

## Critérios de publicação

Uma versão só pode ser publicada quando `npm run check` terminar com sucesso em
uma instalação limpa. O pipeline do GitHub executa lint, testes, build e revisão
de dependências em cada pull request.

Antes da publicação, execute também `npm run db:check`, `npm run db:migrate` e
`npm run db:smoke` contra um banco de homologação criado a partir de backup.

## Disponibilidade e observabilidade

- Monitore `GET /api/health/database` a cada minuto, sem tornar a rota pública na
  internet. Alerta após três falhas consecutivas.
- Colete `stdout` e `stderr` como logs estruturados, removendo senhas, cookies,
  tokens, CPF, endereço e payloads completos de provedores.
- Acompanhe latência p95, respostas 5xx, respostas 429, falhas de webhook e idade
  do evento logístico mais antigo ainda pendente.
- Use um identificador do provedor e da ordem para conciliação; nunca registre
  credenciais ou o corpo integral de uma cobrança.

## Backup e recuperação

- Backup automático diário do PostgreSQL, criptografado e em região separada.
- Retenção sugerida: 7 backups diários, 5 semanais e 12 mensais.
- Teste de restauração mensal em ambiente isolado.
- Objetivos iniciais: RPO de 24 horas e RTO de 4 horas. Reduza o RPO antes de
  aumentar o volume financeiro.

## Segredos e integrações

- Guarde as variáveis de `.env.example` em um cofre de segredos.
- Rotacione chaves de sessão e webhooks em caso de exposição. A troca de
  `SESSION_SECRET` encerra todas as sessões existentes.
- Configure HTTPS obrigatório, HSTS e allowlist de acesso ao painel operacional.
- Webhooks do Mercado Pago e da Lalamove devem usar credenciais próprias por
  ambiente e ser testados contra repetição e entrega fora de ordem.

## Lalamove API V3

### Credenciais e ambientes

No Partner Portal da Lalamove, selecione Sandbox ou Production e obtenha a API
Key e a API Secret em **Developers**. Cadastre o webhook do mesmo ambiente:

`https://smartfix-sand.vercel.app/api/logistics/lalamove/webhook`

Cadastre no projeto Vercel, em **Settings > Environment Variables**, sem expor
os valores em commits ou logs:

- `LALAMOVE_API_KEY`: chave `pk_test` ou `pk_prod` do ambiente;
- `LALAMOVE_API_SECRET`: segredo `sk_test` ou `sk_prod` correspondente;
- `LALAMOVE_MARKET=BR`;
- `LALAMOVE_SANDBOX=true` em Preview e `false` em Production;
- `LALAMOVE_SERVICE_TYPE=MOTORCYCLE` (confirme periodicamente em `GET /v3/cities`);
- `LALAMOVE_API_URL` somente para override controlado. Os padrões são
  `https://rest.sandbox.lalamove.com` e `https://rest.lalamove.com`.

Use credenciais de teste em Preview e credenciais de produção apenas em
Production. A autenticação V3 é HMAC-SHA256. A assinatura hexadecimal minúscula
usa `timestamp`, método, caminho e corpo JSON separados por CRLF; o header é
`Authorization: hmac KEY:TIMESTAMP:SIGNATURE`. Envie também `Market: BR` e um
`Request-ID`. O webhook é validado da mesma forma contra o corpo bruto e o
caminho `/api/logistics/lalamove/webhook`.

### Validação e teste controlado

1. Execute `npm run config:check` e depois `npm run check`.
2. Em Preview, execute `npm run integrations:smoke`. O teste autentica uma
   consulta a `GET /v3/cities` e não cria cotação nem entrega.
3. Cadastre o webhook de Preview no Partner Portal. Confirme HTTP 200, assinatura
   válida e ausência de PII nos logs.
4. Faça uma cotação sandbox por `POST /v3/quotations`. Cotações V3 são honradas
   por cinco minutos. Para entrega imediata, não envie `scheduleAt`.
5. Crie somente após confirmação do preço, usando `POST /v3/orders`. Nunca rode
   esse fluxo em Production sem autorização para uma entrega cobrável.

Endereços têm país `BR`, UF de duas letras, CEP de oito dígitos e coordenadas
obtidas no servidor. Telefones usam E.164 (`+55DDD...`). Consulte pedidos em
`GET /v3/orders/{orderId}`, motorista/localização em
`GET /v3/orders/{orderId}/drivers/{driverId}` e cancele, quando permitido, com
`DELETE /v3/orders/{orderId}`. O `shareLink` HTTPS é o rastreamento oficial.

### Monitoramento, incidentes e conciliação

- Monitore 401 no webhook, 429/5xx da API, entregas em `creating` ou
  `reconciliation_required`, idade do último evento e divergência de frete.
- Eventos são deduplicados por ID e eventos antigos/regressivos não alteram a
  O.S. Estados `canceled` e `returned` permanecem como incidentes operacionais.
- A criação envia `Request-ID` único e metadata `smartfixRef` por O.S. e trecho.
  A idempotência é garantida pelo estado persistido da O.S.; a Lalamove documenta
  `Request-ID` como nonce de suporte, não como chave idempotente.
  Se a resposta for perdida, não tente novamente às cegas: reconcilie no Partner
  Portal e em `GET /v3/orders/{id}` antes de liberar nova tentativa no painel
  `/admin/logistica`.
- Compare `quotedFeeCents`/valor efetivamente retornado pela criação com o frete
  cobrado do cliente. Divergências devem ser revisadas antes do fechamento.
- Logs podem conter IDs técnicos, status e código de erro; não devem conter
  segredo, bearer token, corpo integral do webhook, endereço ou telefone.

### Incidente e rollback

Em assinatura inválida, desabilite temporariamente o webhook no Partner Portal,
preserve evidências, rotacione a API Key/Secret e atualize as variáveis no Vercel.
Em duplicidade ou estado incerto, bloqueie novas tentativas para a O.S. e
reconcilie primeiro no Dashboard. Para rollback de código, promova no Vercel o
último deployment aprovado; mantenha o webhook apontado para uma versão que
continue validando a assinatura. A remoção das credenciais desabilita novas
criações, mas não cancela entregas já aceitas: acompanhe-as manualmente até o
estado terminal.

## LGPD

- Atenda solicitações de acesso por uma exportação autenticada dos dados do
  titular, após confirmação de identidade.
- Pedidos de exclusão devem anonimizar dados pessoais que não precisem ser
  preservados por obrigação legal. Registros fiscais e antifraude seguem a base
  legal e o prazo definidos pelo responsável jurídico.
- Restrinja acesso administrativo pelo princípio do menor privilégio e mantenha
  trilha de auditoria das consultas e alterações sensíveis.
- Documente finalidade, base legal, operador e prazo de retenção para clientes,
  parceiros, mensagens, ordens, pagamentos e eventos logísticos.

## Resposta a incidentes

1. Preserve logs e identifique o intervalo afetado.
2. Revogue credenciais e sessões comprometidas.
3. Isole a integração ou versão causadora sem apagar evidências.
4. Reconcilie ordens, pagamentos e entregas com os provedores.
5. Avalie comunicação aos titulares e à ANPD com orientação jurídica.
6. Registre causa, impacto, correção e ações preventivas.
