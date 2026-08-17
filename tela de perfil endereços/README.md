# SmartFix — RF03 Endereços do Cliente

Implementação do requisito **RF03 — Endereços do Cliente**, permitindo cadastrar, listar, editar, excluir e definir endereços como principal.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- API ViaCEP

## Funcionalidades

- Cadastro de múltiplos endereços.
- Consulta automática de endereço pelo CEP.
- Preenchimento automático de:
  - Logradouro
  - Bairro
  - Cidade
  - Estado
- Número e complemento informados pelo cliente.
- Validação dos campos.
- Listagem dos endereços.
- Edição.
- Exclusão.
- Definição de endereço principal.
- API REST simulando o back-end.
- Dados armazenados temporariamente em memória, sem banco de dados.
- Layout responsivo em azul e branco.

## Como executar

### 1. Instalar Node.js

Tenha o Node.js instalado no computador.

### 2. Abrir a pasta no terminal

```bash
cd smartfix-rf03-enderecos
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Executar

```bash
npm start
```

### 5. Acessar

Abra:

```text
http://localhost:3000
```

## Observação sobre o CEP

A aplicação utiliza o ViaCEP para buscar os dados do endereço. O CEP preenche automaticamente logradouro, bairro, cidade e estado.

O **número do imóvel não é retornado pelo ViaCEP**, portanto ele continua sendo informado manualmente pelo cliente.

## Estrutura

```text
smartfix-rf03-enderecos/
├── package.json
├── server.js
├── README.md
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

## API

### Listar

```http
GET /api/clientes/1/enderecos
```

### Cadastrar

```http
POST /api/clientes/1/enderecos
```

### Atualizar

```http
PUT /api/enderecos/:id
```

### Excluir

```http
DELETE /api/enderecos/:id
```

### Definir como principal

```http
PATCH /api/enderecos/:id/principal
```

## Banco de dados

Neste estágio não existe banco de dados. O servidor mantém os registros em uma estrutura de memória.

Em uma próxima etapa, essa estrutura pode ser substituída por MySQL, PostgreSQL ou outro banco utilizado pelo projeto SmartFix sem precisar mudar a interface da aplicação.
