# Operação do SmartFix em produção

## Checklist de publicação

Execute a partir de `smartfix-app`:

```bash
npm run config:check
npm run typecheck
npm run lint
npm test
npm run build
npm run db:migrate
npm run db:check
```

O migrador cria um backup local não versionado antes de modificar o banco.

## Pagamentos centralizados

Todos os pagamentos são processados pela conta InfinitePay central da SmartFix.
Configure na Vercel Production:

- `INFINITEPAY_API_KEY`: chave secreta do Checkout Integrado;
- `INFINITEPAY_HANDLE`: InfiniteTag da conta central;
- `PAYMENT_PUBLIC_URL`: origem HTTPS pública da plataforma;
- `CRON_SECRET`: segredo usado pelo agendador de expiração das ordens.

O webhook público é `/api/payments/infinitepay/webhook`. Nunca exponha a API Key
em variáveis `NEXT_PUBLIC_*`, commits, logs ou respostas da API.

Os parceiros não conectam gateways próprios. Eles devem cadastrar no Financeiro
uma chave PIX vinculada ao CPF do proprietário ou ao CNPJ da assistência. Os
repasses de serviços pagos e concluídos são operados às quartas-feiras, às 10h.

## Expiração das ordens

O cron da Vercel chama `/api/cron/expire-orders` de hora em hora. A rota exige
`Authorization: Bearer CRON_SECRET`. Ordens orçadas não pagas em 24 horas são
canceladas e notificadas para cliente e assistência.

## Entrega do aparelho

A SmartFix não contrata transporte. Depois do pagamento, a tela do cliente exibe
o endereço completo da assistência, a orientação para entrega presencial ou uso
de serviço particular e o aviso de responsabilidade aplicável.

## Chat por ordem

O chat é liberado somente após a confirmação do pagamento. As mensagens ficam
persistidas em `workflow_records` com `kind = 'order_message'`, vinculadas ao ID
da OS. Monitore crescimento da tabela e erros das rotas `/api/orders/[id]/messages`.

## Segurança e recuperação

- Mantenha `SESSION_SECRET`, credenciais do banco e da InfinitePay somente como
  segredos de produção.
- Rotacione imediatamente qualquer credencial exposta ou suspeita.
- Verifique logs e auditoria sem registrar dados pessoais ou meios de pagamento.
- Em rollback de código, promova o último deployment aprovado na Vercel. Não
  reverta migrations destrutivas sem restaurar o backup e validar o esquema.
