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
- `CRON_SECRET`: segredo da rota administrativa de execução manual do job.

O webhook público é `/api/payments/infinitepay/webhook`. Nunca exponha a API Key
em variáveis `NEXT_PUBLIC_*`, commits, logs ou respostas da API.

Os parceiros não conectam gateways próprios. Eles devem cadastrar no Financeiro
uma chave PIX vinculada ao CPF do proprietário ou ao CNPJ da assistência. Os
repasses de serviços pagos e concluídos são operados às quartas-feiras, às 10h.

## Expiração das ordens

O PostgreSQL/Supabase executa `smartfix_cancel_expired_unpaid_orders()` de hora
em hora por meio do `pg_cron`. A rota `/api/cron/expire-orders`, protegida por
`Authorization: Bearer CRON_SECRET`, permanece disponível para contingência.
Ordens orçadas não pagas em 24 horas são canceladas e notificadas para cliente e
assistência.

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
