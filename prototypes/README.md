# Protótipos SmartFix

Esta pasta reúne demonstrações independentes criadas durante o desenvolvimento.
Cada subpasta possui seu próprio `package.json` e pode ser executada com:

```bash
npm ci
npm run dev
```

## Conteúdo

| Pasta | Origem | Situação |
| --- | --- | --- |
| `agendamento/` | componente de agendamento | prova de conceito Vite |
| `gerador-qrcode/` | gerador de QR Code | prova de conceito Vite |
| `orcamento/` | emissão de orçamento | prova de conceito Vite |
| `tela-custo/` | tela detalhada de custos | código de referência não executável isoladamente |
| `checkout-servico/` | contribuição de checkout | prova de conceito Vite |
| `selecao-dispositivos/` | seleção de dispositivos | prova de conceito Vite |

Os protótipos não fazem parte do build do aplicativo Next.js em `smartfix-app`.
Para produção, as funcionalidades devem ser migradas para as rotas e componentes
do aplicativo principal. Apenas subpastas com `package.json` podem ser executadas
com os comandos acima.
