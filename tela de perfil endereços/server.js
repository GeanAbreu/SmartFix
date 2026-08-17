const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Simulação de banco de dados: os dados ficam somente na memória.
let enderecos = [
  {
    id: 1,
    clienteId: 1,
    identificacao: "Casa",
    tipo: "Casa",
    cep: "06400-000",
    logradouro: "Rua Exemplo",
    numero: "123",
    complemento: "",
    bairro: "Centro",
    cidade: "Barueri",
    estado: "SP",
    principal: true
  }
];

let proximoId = 2;

// Listar endereços de um cliente
app.get("/api/clientes/:clienteId/enderecos", (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const resultado = enderecos.filter((endereco) => endereco.clienteId === clienteId);
  res.json(resultado);
});

// Cadastrar endereço
app.post("/api/clientes/:clienteId/enderecos", (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const {
    identificacao,
    tipo,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    principal
  } = req.body;

  if (!identificacao || !tipo || !cep || !logradouro || !numero ||
      !bairro || !cidade || !estado) {
    return res.status(400).json({
      mensagem: "Preencha todos os campos obrigatórios."
    });
  }

  // Se este for o principal, os demais deixam de ser principais.
  if (principal) {
    enderecos = enderecos.map((endereco) => ({
      ...endereco,
      principal: endereco.clienteId === clienteId ? false : endereco.principal
    }));
  }

  const novoEndereco = {
    id: proximoId++,
    clienteId,
    identificacao,
    tipo,
    cep,
    logradouro,
    numero,
    complemento: complemento || "",
    bairro,
    cidade,
    estado,
    principal: Boolean(principal)
  };

  enderecos.push(novoEndereco);

  res.status(201).json(novoEndereco);
});

// Atualizar endereço
app.put("/api/enderecos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = enderecos.findIndex((endereco) => endereco.id === id);

  if (indice === -1) {
    return res.status(404).json({ mensagem: "Endereço não encontrado." });
  }

  const atual = enderecos[indice];
  const dados = req.body;

  if (dados.principal) {
    enderecos = enderecos.map((endereco) => ({
      ...endereco,
      principal: endereco.clienteId === atual.clienteId ? false : endereco.principal
    }));
  }

  enderecos[indice] = {
    ...atual,
    ...dados,
    id: atual.id,
    clienteId: atual.clienteId
  };

  res.json(enderecos[indice]);
});

// Excluir endereço
app.delete("/api/enderecos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = enderecos.findIndex((endereco) => endereco.id === id);

  if (indice === -1) {
    return res.status(404).json({ mensagem: "Endereço não encontrado." });
  }

  const removido = enderecos.splice(indice, 1)[0];

  res.json({
    mensagem: "Endereço excluído com sucesso.",
    endereco: removido
  });
});

// Define um endereço como principal
app.patch("/api/enderecos/:id/principal", (req, res) => {
  const id = Number(req.params.id);
  const endereco = enderecos.find((item) => item.id === id);

  if (!endereco) {
    return res.status(404).json({ mensagem: "Endereço não encontrado." });
  }

  enderecos = enderecos.map((item) => ({
    ...item,
    principal: item.clienteId === endereco.clienteId ? item.id === id : item.principal
  }));

  res.json(enderecos.find((item) => item.id === id));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`SmartFix RF03 disponível em http://localhost:${PORT}`);
});