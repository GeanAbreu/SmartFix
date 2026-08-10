Diagrama de Implantação (Deployment)

### Descrição
Representa os nós de hardware e a infraestrutura física/cloud em que a solução SmartFix é executada em produção, destacando o ambiente Serverless da Vercel para a camada web e o cluster do Supabase para persistência de dados.

```mermaid
deploymentDiagram
    node "Cliente / User Device" {
        node "Navegador Web" {
            artifact "SmartFix PWA Client App"
        }
    }

    node "Vercel Edge Network" {
        node "Serverless Container" {
            artifact "Next.js App Router API"
        }
    }

    node "Supabase Cloud" {
        node "Database Server" {
            artifact "PostgreSQL Instance"
        }
        node "Storage Engine" {
            artifact "Media Storage Bucket"
        }
    }

    "SmartFix PWA Client App" -- "Next.js App Router API" : HTTPS / WebSocket
    "Next.js App Router API" -- "PostgreSQL Instance" : SSL Connection
    "Next.js App Router API" -- "Media Storage Bucket" : S3 API
```
