# SmartFix — Checkout de Serviço (React + TypeScript)

Conversão em componentes React/TS do protótipo de checkout aprovado, seguindo a
identidade visual e a estrutura de pastas definidas no prompt mestre do SmartFix.

## Rodar isoladamente

```bash
npm install
npm run dev
```

Isto sobe uma demo standalone (`src/App.tsx`) só para visualizar a página de
checkout com dados mockados.

## Como integrar no projeto principal do SmartFix

Este pacote foi organizado para ser colado direto dentro de `src/` do projeto
SmartFix maior. Mapeamento de pastas:

| Aqui                                  | No projeto SmartFix                                  |
|----------------------------------------|--------------------------------------------------------|
| `src/pages/Checkout/`                  | `src/pages/SolicitarServico/Revisao/` (Etapa 4 do fluxo) |
| `src/components/*`                     | `src/components/*` (mesmos nomes, sem conflito)        |
| `src/types/checkout.ts`                | `src/types/checkout.ts`                                 |
| `src/utils/format.ts`, `validators.ts` | `src/utils/`                                             |
| `src/hooks/useCountdown.ts`            | `src/hooks/`                                             |
| `src/styles/variables.css`             | mesclar com o `:root` global de `index.css`             |

Passos:

1. Copie as pastas `components/`, `pages/Checkout/`, `types/`, `utils/` e
   `hooks/` para dentro do `src/` do projeto principal.
2. Garanta que `lucide-react` está instalado (`npm install lucide-react`).
3. Adicione a rota no `react-router`, dentro do fluxo de Solicitar Serviço:

   ```tsx
   <Route path="/solicitar-servico/revisao" element={<Checkout />} />
   ```

4. Troque os dados mockados (`MOCK_SERVICE`, `MOCK_VALUES`, `MOCK_PIX_CODE`)
   por dados reais vindos do estado do fluxo de solicitação (etapas 1–3) e,
   futuramente, do Supabase (`services/supabase/ordens.ts`).
5. Ligue `onPaymentConfirmed` à navegação real para `/ordens/:id`, e
   `onBack` à navegação para a etapa anterior (Endereço).

## Pontos de integração futura (Supabase)

Marcados com `// TODO` no código:

- `Checkout.tsx` → `handleApplyCoupon`: validar cupom via backend.
- `Checkout.tsx` → `handleSubmit`: substituir o `setTimeout` mock pela
  chamada real de criação da ordem + processamento do pagamento.
- `PixPanel.tsx`: o QR code é um placeholder desenhado em SVG — trocar pelo
  QR real gerado a partir do payload PIX retornado pelo backend.

## Decisões de implementação

- **CSS Modules** em vez de CSS global, conforme a seção 5/34 do prompt
  mestre — cada componente carrega só as classes que usa, sem risco de
  colisão de nomes entre páginas.
- **Tokens de cor centralizados** em `styles/variables.css`, importado uma
  única vez — qualquer ajuste de paleta se propaga para todos os componentes.
- **Validação client-side simples** em `utils/validators.ts`, sem
  dependência externa (ex.: Zod) para manter o pacote enxuto; trocar por uma
  lib de validação quando o projeto principal já tiver uma definida.
- Os cards (`ServiceSummaryCard`, `OrderSummaryCard`) reimplementam o
  "shell" visual de card em vez de importar um componente `Card` genérico,
  já que este pacote é standalone. Ao integrar no projeto principal, vale
  refatorá-los para usar `components/Card` se ele já seguir o mesmo
  padrão visual.
