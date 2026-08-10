Diagrama de Sequência

### Descrição
Demonstra a troca cronológica de mensagens entre os atores (Cliente, Assistência Técnica) e os componentes do sistema (Front-end/PWA, API Serverless e Banco de Dados) ao longo do tempo. Cobre desde a solicitação inicial do reparo até a aprovação/recusa de orçamento, checkout financeiro e entrega do dispositivo.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário
    participant Sistema as Sistema Smartfix
    participant Assistencia as Assistência Técnica
    participant BD as Banco de Dados

    Usuario->>Sistema: Descrição do Problema
    Sistema->>Assistencia: Encaminhar solicitação
    Assistencia-->>Sistema: Retornar estimativa
    Sistema-->>Usuario: Exibir estimativa
    Usuario->>Sistema: Solicitar agendamento
    Sistema->>Assistencia: Agendar coleta
    Assistencia-->>Sistema: Envio de data e hora
    Usuario->>Sistema: Aguardar Confirmação
    Sistema-->>Usuario: Confirmar data e hora
    Sistema->>Assistencia: Encaminha confirmação
    Assistencia->>Sistema: Coleta realizada
    Assistencia->>Sistema: Enviar orçamento final
    Sistema-->>Usuario: Exibir orçamento

    alt Recusado
        Usuario->>Sistema: Rejeitar orçamento
        Sistema->>Assistencia: Cancelar serviço
    else Aprovado
        Usuario->>Sistema: Aprovar orçamento
        Usuario->>Sistema: Realizar pagamento
        Assistencia->>Sistema: Confirmar Pagamento
        Assistencia->>Sistema: Pagamento confirmado
        Assistencia->>BD: Registrar transação
        Assistencia->>Sistema: Reparo iniciado
        Sistema-->>Usuario: Atualizar Status de Reparo
        Assistencia->>Sistema: Reparo Concluído
        Sistema-->>Usuario: Atualizar Status de Reparo
        Usuario->>Sistema: Solicitar data de entrega
        Assistencia-->>Sistema: Data de entrega enviada
        Sistema-->>Usuario: Encaminhar data de entrega
        Usuario->>Sistema: Confirmar entrega
        Assistencia->>Sistema: Entrega concluída
        Assistencia->>BD: Registrar serviço e entrega
    end
```
