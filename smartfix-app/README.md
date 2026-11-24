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

## Logística imediata com Lalamove

Configure `LALAMOVE_API_KEY`, `LALAMOVE_API_SECRET`, `LALAMOVE_MARKET=BR`,
`LALAMOVE_SANDBOX` e `LALAMOVE_SERVICE_TYPE=MOTORCYCLE`, conforme
[`.env.example`](.env.example). Cadastre o endpoint HTTPS
`/api/logistics/lalamove/webhook` no Partner Portal do mesmo ambiente.

Cada trecho é independente: cliente → assistência e assistência → cliente. A
cotação V3 usa coordenadas obtidas no servidor, omite `scheduleAt` para solicitar
um motorista imediatamente e permanece válida por cerca de cinco minutos. A
criação usa o `quotationId`, contatos em E.164, POD, metadata interna e um
`Request-ID` único por chamada. O bloqueio transacional da O.S. impede duplicatas;
respostas incertas exigem reconciliação antes de nova tentativa. O link HTTPS retornado pela Lalamove
é usado para acompanhamento. Eventos autenticados são deduplicados e não podem
regredir o estado da entrega.

## Validação das integrações

Use `npm run config:check` para detectar variáveis ausentes, grupos parcialmente configurados e URLs inseguras antes do deploy. O comando não exibe segredos.

Use `npm run integrations:smoke` em um ambiente controlado para validar, de forma somente leitura, as credenciais configuradas de Mercado Pago, Resend, Supabase, Lalamove e Photon. Para a Lalamove, o teste consulta `GET /v3/cities`; não cria cotação nem entrega. Google OAuth e provedores de WhatsApp continuam exigindo seus fluxos de sandbox próprios.
