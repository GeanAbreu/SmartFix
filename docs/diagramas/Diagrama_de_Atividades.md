Diagrama de Atividades

### Descrição
Ilustra o fluxo do processo de ponta a ponta nas raias de cada papel (Motoboy, Cliente, Sistema e Prestador). Modela as regras de decisão para aceite de orçamento, triagem, envio de notificações e as entregas intermediárias até a confirmação do cliente e encerramento.

```mermaid
flowchart TD
    subgraph Cliente
        A[Criar solicitação] --> B[Submeter solicitação]
        G[Aprovar Orçamento?] -->|Sim| H[Enviar Produto]
        G -->|Não| I[Notificar Cancelamento]
        N[Confirmar Recebimento] --> O{Problema Resolvido?}
        O -->|Sim| P[Avaliar Serviço]
        O -->|Não| Q[Acionar Garantia]
    end

    subgraph Sistema
        B --> C[Processar Cadastro e Matchmaking]
        C --> D[Notificar Prestador]
        J[Gerar Matchmaking Motoboy] --> K[Acompanhar Entrega]
    end

    subgraph Prestador
        D --> E[Analisar Pedido]
        E --> F{Aceitar Pedido?}
        F -->|Sim| F1[Elaborar Orçamento]
        F -->|Não| F2[Rejeitar Solicitação]
        F1 --> G
        H --> L[Iniciar Reparo]
        L --> M[Concluir Reparo e Enviar]
    end

    M --> N
```
