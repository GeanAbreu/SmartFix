Diagrama de Classes

### Descrição
Mapeia a estrutura estática das classes do sistema, definindo os atributos, métodos e heranças do domínio. Demonstra como os atores do sistema especializam a classe base `Usuario` e como interagem com os módulos operacionais de `OrdemServico` e `Pagamento`.

```mermaid
classDiagram
    class Usuario {
        +int id_usuario
        +string nome
        +string email
        +string senha
        +login()
        +recuperarSenha()
    }

    class Cliente {
        +string cpf
        +string endereco
        +solicitarOrcamento()
        +aprovarOrcamento()
        +avaliarServico()
    }

    class AssistenciaTecnica {
        +string cnpj
        +string razaoSocial
        +enviarOrcamento()
        +atualizarStatusOS()
    }

    class OrdemServico {
        +int id_os
        +string descricaoProblema
        +string status
        +float valorTotal
        +criarOS()
        +cancelarOS()
    }

    class Pagamento {
        +int id_pagamento
        +float valor
        +string metodo
        +string status
        +processarPagamento()
    }

    Usuario <|-- Cliente
    Usuario <|-- AssistenciaTecnica
    Cliente "1" -- "0..*" OrdemServico : abre
    AssistenciaTecnica "1" -- "0..*" OrdemServico : atende
    OrdemServico "1" -- "0..1" Pagamento : possui
```
