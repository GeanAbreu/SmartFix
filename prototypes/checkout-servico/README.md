# SmartFix — Checkout de Serviço (React + TypeScript)

Protótipo independente do checkout do SmartFix. Ele fica fora de `smartfix-app`
para que a configuração Vite não interfira no build do aplicativo Next.js.

## Rodar isoladamente

```bash
npm ci
npm run dev
```

O cupom demonstrativo `SMART10` aplica 10% de desconto. Os dados e a confirmação
de pagamento são simulados e não persistem no banco.
