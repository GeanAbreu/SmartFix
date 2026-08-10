Diagrama de Casos de Uso

### Descrição
Descreve as principais funcionalidades do sistema SmartFix a partir da perspectiva dos atores que interagem com a plataforma (`Cliente`, `Assistência Técnica`, `Entregador` e `Administrador`). Mapeia os casos de uso operacionais, como abertura de chamados, envio e aprovação de orçamentos, gestão de entregas e administração de contas.

```mermaid
graph LR
    subgraph Atores
        C[Cliente]
        A[Assistência Técnica]
        E[Entregador]
        ADM[Administrador]
    end

    subgraph SmartFix["Plataforma SmartFix"]
        UC1([Solicitar Orçamento / Reparo])
        UC2([Aprovar / Recusar Orçamento])
        UC3([Realizar Pagamento])
        UC4([Avaliar Serviço])
        
        UC5([Elaborar e Enviar Orçamento])
        UC6([Atualizar Status do Reparo])
        
        UC7([Aceitar Coleta / Entrega])
        UC8([Confirmar Conclusão da Entrega])
        
        UC9([Gerenciar Usuários e Permissões])
        UC10([Visualizar Relatórios do Sistema])
    end

    %% Relações do Cliente
    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC4

    %% Relações da Assistência Técnica
    A --> UC5
    A --> UC6

    %% Relações do Entregador
    E --> UC7
    E --> UC8

    %% Relações do Administrador
    ADM --> UC9
    ADM --> UC10
```
