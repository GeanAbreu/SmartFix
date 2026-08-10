Diagrama de Gráfico de Estados (Ciclo da OS)

### Descrição
Descreve os estados possíveis de uma Ordem de Serviço (OS) ao longo do seu ciclo de vida dentro da plataforma SmartFix, destacando as transições gatilhadas pelas ações do cliente, do parceiro ou por eventos de pagamento.

```mermaid
stateDiagram-v2
    [*] --> Criada: Solicitação enviada
    Criada --> EmAnalise: Assistência recebe
    EmAnalise --> OrcamentoEnviado: Orçamento emitido
    
    state OrcamentoEnviado {
        [*] --> AguardandoAprovacao
        AguardandoAprovacao --> Aprovado: Cliente aceita
        AguardandoAprovacao --> Recusado: Cliente rejeita
    }

    Recusado --> Cancelado
    Aprovado --> EmReparo: Pagamento confirmado
    EmReparo --> ProntoParaEntrega: Reparo concluído
    ProntoParaEntrega --> Concluido: Entregue ao cliente
    Cancelado --> [*]
    Concluido --> [*]
```
