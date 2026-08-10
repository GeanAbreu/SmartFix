Diagrama de Implantação (Deployment)

### Descrição
Representa os nós de hardware e a infraestrutura física/cloud em que a solução SmartFix é executada em produção, destacando o ambiente Serverless da Vercel para a camada web e o cluster do Supabase para persistência de dados.

```mermaid
flowchart TB
    subgraph ClientDevice["Dispositivo do Cliente"]
        Browser["Navegador Web Mobile / Desktop"]
        App["SmartFix PWA Client"]
        Browser --- App
    end

    subgraph VercelCloud["Vercel Edge Network"]
        Serverless["Serverless Node.js Environment"]
        NextAPI["Next.js App Router API"]
        Serverless --- NextAPI
    end

    subgraph SupabaseCloud["Supabase Cloud Platform"]
        DBNode[("PostgreSQL Database Server")]
        StorageNode["Media Storage Bucket (S3)"]
    end

    App -->|HTTPS / WSS| NextAPI
    NextAPI -->|SSL / TCP Connection| DBNode
    NextAPI -->|S3 Protocol| StorageNode
```
