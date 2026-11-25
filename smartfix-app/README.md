# SmartFix App

Aplicação Next.js principal do repositório. Consulte o [README da raiz](../README.md)
para o escopo e as instruções de execução. As opções de ambiente estão em
[`.env.example`](.env.example) e o modelo de dados em [database/DER.md](../database/DER.md).

```powershell
npm ci
npm run dev
npm run lint
npm test
npm run build
```

`npm run check` executa lint, typecheck, testes e build em sequência. O build padrão usa
Webpack por compatibilidade com ambientes Windows que não permitem ao Turbopack
criar junctions dentro de `.next`; `npm run build:turbopack` continua disponível
para validar o empacotador novo.

O checklist de publicação, backup, observabilidade, incidentes e LGPD está em
[`docs/OPERACAO_PRODUCAO.md`](../docs/OPERACAO_PRODUCAO.md).

## Notificações de status por WhatsApp

As mudanças de status da ordem disparam uma mensagem para o telefone cadastrado
do cliente. O envio é feito depois da persistência da OS: indisponibilidade do
provedor não desfaz a atualização, e a resposta da API informa
`whatsappStatus` (`accepted`, `failed`, `missing_phone`, `not_configured` ou
`not_applicable`).

Configure um dos provedores em `.env.local`, seguindo as variáveis documentadas
em [`.env.example`](.env.example):

- `WHATSAPP_PROVIDER=evolution` com `EVOLUTION_API_URL`,
  `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE`; ou
- `WHATSAPP_PROVIDER=zapi` com `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN` e, quando
  habilitado na conta, `ZAPI_CLIENT_TOKEN`.

Telefones nacionais recebem por padrão o DDI `55`; altere
`WHATSAPP_DEFAULT_COUNTRY_CODE` para outra operação regional.

## Pagamento central e entrega do aparelho

Configure `INFINITEPAY_API_KEY`, `INFINITEPAY_HANDLE` e `PAYMENT_PUBLIC_URL`.
Todos os checkouts usam a conta central da SmartFix. Após o pagamento, o cliente
recebe o endereço da assistência e combina a entrega diretamente, por meios
próprios. Não há contratação automática de transporte pela plataforma.

## Validação das integrações

Use `npm run config:check` para detectar variáveis ausentes, grupos parcialmente configurados e URLs inseguras antes do deploy. O comando não exibe segredos.

Use `npm run integrations:smoke` em um ambiente controlado para validar, de forma somente leitura, Resend, Supabase e Photon. O checkout InfinitePay deve ser validado com uma OS de teste controlada. Google OAuth e provedores de WhatsApp continuam exigindo seus fluxos de sandbox próprios.
