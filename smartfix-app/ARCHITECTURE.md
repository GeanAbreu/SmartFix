# Arquitetura MVC do SmartFix

O SmartFix usa uma adaptação do MVC para o App Router do Next.js. As páginas e os
Route Handlers continuam em `app/`, como exigido pelo framework, enquanto regras de
negócio e persistência ficam fora da camada HTTP.

## Fluxo de uma requisição

```text
View (app/**/page.tsx)
  -> Route Handler (app/api/**/route.ts)
  -> Controller (src/controllers)
  -> Service (src/services)
  -> Repository (src/repositories)
  -> Model (src/models)
```

## Responsabilidade das pastas

- `app/`: views, layouts e os adaptadores HTTP do Next.js. Um `route.ts` só liga um
  verbo HTTP ao controller e resolve parâmetros da URL.
- `src/controllers/`: autenticação/autorização da requisição, validação da entrada e
  formatação da resposta HTTP. Controllers não devem consultar o Sequelize.
- `src/services/`: casos de uso e regras de negócio, sem conhecimento de status HTTP
  ou componentes React.
- `src/repositories/`: única camada que consulta ou altera models Sequelize.
- `src/models/`: entidades e mapeamento do banco de dados.
- `src/validations/`: schemas de entrada reutilizáveis.
- `src/middlewares/`: preocupações transversais, como sessão e autorização.
- `src/types/`: contratos compartilhados entre as camadas.

## Convenções

1. Não criar uma segunda árvore de rotas em `src/routes`: o App Router já é o
   roteador da aplicação.
2. O Route Handler não contém regra de negócio.
3. O controller não importa `src/models`; ele chama um service.
4. O service pode coordenar vários repositories e aplicar regras de negócio.
5. O repository não cria respostas HTTP nem conhece componentes da interface.
6. Componentes específicos de uma página podem permanecer junto da view; componentes
   compartilhados ficam em `app/components` até a migração por domínio.

## Exemplo de referência

O cadastro de dispositivos é a implementação de referência:

- `app/api/clients/devices/route.ts`: entrada HTTP;
- `src/controllers/DeviceController.ts`: sessão, validação e resposta;
- `src/services/device.service.ts`: caso de uso e escolha entre armazenamento local
  e banco;
- `src/repositories/device.repository.ts`: operações Sequelize;
- `src/models/ClientDevice.ts`: entidade persistida.

Novas funcionalidades devem seguir esse fluxo. Funcionalidades antigas podem ser
migradas gradualmente, sempre com testes antes de remover o acesso direto aos models.
