import assert from "node:assert/strict";
import test from "node:test";
import { addressInputSchema } from "../src/validations/address.validation";

const validAddress = {
  apelido: "Casa",
  cep: "06400-000",
  logradouro: "Rua Exemplo",
  numero: "123",
  complemento: "",
  bairro: "Centro",
  cidade: "Barueri",
  estado: "sp",
  principal: true,
};

test("aceita e normaliza um endereço válido", () => {
  const result = addressInputSchema.parse(validAddress);
  assert.equal(result.estado, "SP");
});

test("rejeita CEP, UF e identificação inválidos", () => {
  const result = addressInputSchema.safeParse({
    ...validAddress,
    apelido: "x",
    cep: "123",
    estado: "São Paulo",
  });
  assert.equal(result.success, false);
});
