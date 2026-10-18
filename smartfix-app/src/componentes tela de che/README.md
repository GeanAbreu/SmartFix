# SmartFix — Modal de Comprovante Digital

Componente React + TypeScript com estilo azul-marinho/laranja, PDF via jsPDF e compartilhamento via Web Share API.

## 1. Instale as dependências

No terminal do projeto React:

```bash
npm install lucide-react jspdf
```

## 2. Copie os arquivos

Copie `ComprovantePagamentoModal.tsx` e `ComprovantePagamentoModal.css` para a pasta de componentes, por exemplo:

```text
src/
  components/
    ComprovantePagamentoModal.tsx
    ComprovantePagamentoModal.css
```

## 3. Exemplo de uso

```tsx
import { useState } from "react";
import ComprovantePagamentoModal, {
  type DadosComprovante,
} from "./components/ComprovantePagamentoModal";

const comprovante: DadosComprovante = {
  status: "pago",
  valor: 289.9,
  numeroOS: "SF-2026-0142",
  dataPagamento: "2026-10-18T14:30:00-03:00",
  formaPagamento: "PIX",
  clienteNome: "Nome do cliente",
  parceiroNome: "Assistência Técnica Exemplo",
  identificadorTransacao: "SFX-8A29-20261018",
  descricaoServico: "Reparo de dispositivo",
  taxa: 0,
};

export default function MinhaTela() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button onClick={() => setAberto(true)}>
        Ver comprovante
      </button>

      <ComprovantePagamentoModal
        aberto={aberto}
        onFechar={() => setAberto(false)}
        dados={comprovante}
      />
    </>
  );
}
```

## Observações

- Os valores do exemplo são fictícios; substitua pelos dados reais da ordem de serviço e do provedor de pagamento.
- `status: "pago"` só deve ser passado após validação confiável do backend/provedor. Não use o estado visual do modal para confirmar pagamentos.
- `dataPagamento` deve preferencialmente ser uma data ISO com fuso horário. Se o backend fornecer apenas uma data formatada, ela também será exibida como texto.
- O PDF é gerado no navegador e contém os dados informados ao componente. Para comprovantes oficiais, use o identificador e os dados confirmados pelo sistema de pagamentos.
- A API de compartilhamento depende do navegador e, normalmente, de HTTPS; quando não existir, o componente tenta copiar o resumo para a área de transferência.
- O modal fecha pelo botão, clique no fundo e tecla Escape.
