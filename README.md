# SmartFix

## Escopo do projeto

O SmartFix é uma plataforma web que conecta clientes a assistências técnicas para organizar o reparo de dispositivos eletrônicos. O cliente cadastra o aparelho, solicita o serviço, acompanha a ordem, decide sobre o orçamento e pode avaliar o atendimento após a conclusão. A assistência recebe a solicitação, registra o diagnóstico e o orçamento e atualiza as etapas do reparo. A administração gerencia o credenciamento das assistências.

O escopo planejado também inclui logística de coleta e entrega e pagamento pela plataforma. Consulte [Escopo do Projeto](docs/Escopo_Projeto.md) para os limites e objetivos completos.

## Como executar

**Pré-requisitos:** Node.js 24, npm e PostgreSQL com o esquema do SmartFix. A aplicação está em `smartfix-app/`.

1. Instale as dependências:

   ```powershell
   cd smartfix-app
   npm ci
   ```

2. Crie o arquivo de ambiente e configure `DATABASE_URL` e uma `SESSION_SECRET` aleatória com pelo menos 32 caracteres. As demais opções estão descritas no próprio arquivo de exemplo.

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Se o banco ainda não tiver o esquema, crie as tabelas base pelos arquivos de `../Database/tables/` na ordem `clients.sql`, `partners.sql`, `client_addresses.sql` e `client_devices.sql`. Depois aplique as migrations:

   ```powershell
   npm run db:migrate
   npm run db:check
   ```

   Para um banco já preparado, execute apenas `npm run db:check`. Não reaplique as migrations antigas manualmente sobre um banco com o DER atual.

4. Inicie a aplicação e abra [http://localhost:3000](http://localhost:3000):

   ```powershell
   npm run dev
   ```
