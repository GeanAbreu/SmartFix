# 🗄️ Diagrama Entidade-Relacionamento (DER) — SmartFix

```mermaid
erDiagram
    CLIENTE ||--o{ PEDIDO_REPARO : realiza
    ASSISTENCIA_TECNICA ||--o{ PEDIDO_REPARO : atende
    ENTREGADOR ||--o{ PEDIDO_REPARO : realiza_entrega
    PEDIDO_REPARO ||--o| PAGAMENTO : gera
    CLIENTE ||--o{ AVALIACAO : escreve
    ASSISTENCIA_TECNICA ||--o{ AVALIACAO : recebe

    CLIENTE {
        int id_cliente PK
        string nome
        string email
        string telefone
        string endereco
    }

    ASSISTENCIA_TECNICA {
        int id_assistencia PK
        string nome_empresa
        string cnpj
        string email
        string telefone
        string endereco
    }

    ENTREGADOR {
        int id_entregador PK
        string nome
        string telefone
        string veiculo
    }

    PEDIDO_REPARO {
        int id_pedido PK
        string descricao_problema
        string status
        date data_solicitacao
        decimal valor_orcamento
        int id_cliente FK
        int id_assistencia FK
        int id_entregador FK
    }

    PAGAMENTO {
        int id_pagamento PK
        decimal valor
        string metodo_pagamento
        string status_pagamento
        date data_pagamento
        int id_pedido FK
    }

    AVALIACAO {
        int id_avaliacao PK
        int nota
        string comentario
        date data_avaliacao
        int id_cliente FK
        int id_assistencia FK
    }
