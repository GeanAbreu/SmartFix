Diagrama de Componentes (Arquitetura)

### Descrição
Modela a estrutura de software da aplicação, detalhando os módulos independentes (PWA Front-end, API Serverless no Next.js, Autenticação/Banco no Supabase) e como eles se integram via serviços de borda e conexões bancárias via gateways.

```mermaid
graph TD
    subgraph Dispositivo_Usuario["Dispositivo do Usuário"]
        PWA["Navegador / PWA (React + Next.js)"]
    end

    subgraph Nuvem["Infraestrutura Nuvem (Vercel & Supabase)"]
        API["API Routes (Node.js Serverless)"]
        Auth["Supabase Auth"]
        DB[("Database PostgreSQL")]
    end

    subgraph Terceiros["Serviços Terceirizados"]
        Gateway["Gateway de Pagamentos"]
    end

    PWA -->|Requisições HTTPS / JSON| API
    PWA -->|Autenticação| Auth
    API -->|Consultas SQL / Realtime| DB
    API -->|Processamento PIX / Cartão| Gateway
```
