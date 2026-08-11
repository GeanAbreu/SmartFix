# 🗄️ Diagrama Entidade-Relacionamento (DER) — SmartFix

**Documentação do Banco de Dados Relacional (Supabase / PostgreSQL)**  
**Projeto:** SmartFix PWA Marketplace | **Arquitetura:** Next.js + Supabase / PostgreSQL  

---

## 📊 1. Diagrama DER

```mermaid
erDiagram
    CLIENTS ||--o{ DEVICES : owns
    CLIENTS ||--o{ REPAIR_ORDERS : requests
    CLIENTS ||--o{ REVIEWS : writes

    PARTNER ||--o{ REPAIR_ORDERS : services
    PARTNER ||--o{ REVIEWS : receives

    DEVICES ||--o{ REPAIR_ORDERS : linked_to
    REPAIR_ORDERS ||--o| REVIEWS : yields

    CLIENTS {
        uuid id PK
        string full_name
        string email
        string phone
        string address
        string tax_id
        date birth_date
        uuid user_id FK
    }

    PARTNER {
        uuid id PK
        string company_name
        string tax_id
        string email
        string phone
        string address
        uuid user_id FK
    }

    DEVICES {
        uuid id PK
        string device_type
        string brand
        string model
        string issue_type
        string issue_description
        uuid user_id FK
    }

    REPAIR_ORDERS {
        uuid id PK
        string problem_description
        string status
        date request_date
        decimal estimated_budget
        uuid client_id FK
        uuid partner_id FK
        uuid device_id FK
    }

    REVIEWS {
        uuid id PK
        int rating
        string comment
        date review_date
        uuid client_id FK
        uuid partner_id FK
        uuid repair_order_id FK
    }
