import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "../src/validations/auth.validation";

const validClientRegistration = {
  tipoUsuario: "cliente" as const,
  nomeCompleto: "Cliente de Teste",
  email: "cliente@example.com",
  telefone: "(11) 99999-9999",
  documento: "529.982.247-25",
  dataNascimento: "1990-05-20",
  senha: "Senha@123",
  confirmarSenha: "Senha@123",
  cep: "01001-000",
  rua: "Praça da Sé",
  numero: "100",
  complemento: "",
  bairro: "Sé",
  municipio: "São Paulo",
  uf: "SP",
};

test("aceita um cadastro de cliente válido", () => {
  const result = registerSchema.safeParse(validClientRegistration);
  assert.equal(result.success, true);
});

test("rejeita confirmação de senha diferente", () => {
  const result = registerSchema.safeParse({
    ...validClientRegistration,
    confirmarSenha: "Outra@123",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((issue) => issue.path[0] === "confirmarSenha"));
  }
});

test("rejeita CPF, telefone, CEP e UF inválidos", () => {
  const result = registerSchema.safeParse({
    ...validClientRegistration,
    telefone: "1199",
    documento: "111.111.111-11",
    cep: "123",
    uf: "S1",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
    assert.ok(fields.has("telefone"));
    assert.ok(fields.has("documento"));
    assert.ok(fields.has("cep"));
    assert.ok(fields.has("uf"));
  }
});

test("aceita login e limita senhas excessivamente longas", () => {
  assert.equal(
    loginSchema.safeParse({ identificador: "cliente@example.com", senha: "x" }).success,
    true
  );
  assert.equal(
    loginSchema.safeParse({
      identificador: "cliente@example.com",
      senha: "x".repeat(129),
    }).success,
    false
  );
});

