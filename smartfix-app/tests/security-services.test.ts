import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import {
  hashPassword,
  passwordNeedsRehash,
  verifyPassword,
} from "../src/services/password.service";
import {
  createSessionToken,
  verifySessionToken,
} from "../src/services/session.service";

process.env.SESSION_SECRET = "smartfix-test-secret-with-at-least-32-characters";

test("gera e valida hash bcrypt sem aceitar senha incorreta", async () => {
  const hash = await hashPassword("Senha@123");

  assert.equal(await verifyPassword("Senha@123", hash), true);
  assert.equal(await verifyPassword("senha-incorreta", hash), false);
  assert.equal(passwordNeedsRehash(hash), false);
});

test("mantém compatibilidade temporária e detecta senha legada", async () => {
  assert.equal(await verifyPassword("senha-legada", "senha-legada"), true);
  assert.equal(await verifyPassword("outra", "senha-legada"), false);
  assert.equal(passwordNeedsRehash("senha-legada"), true);
});

test("detecta bcrypt com custo antigo para atualização", async () => {
  const oldHash = await bcrypt.hash("Senha@123", 4);
  assert.equal(passwordNeedsRehash(oldHash), true);
});

test("assina sessão mínima e rejeita token adulterado ou malformado", () => {
  const token = createSessionToken({ sub: "client-id", role: "client" });
  const session = verifySessionToken(token);

  assert.equal(session?.sub, "client-id");
  assert.equal(session?.role, "client");
  assert.equal(verifySessionToken(`${token}.extra`), null);

  const lastCharacter = token.at(-1) === "a" ? "b" : "a";
  const tamperedToken = `${token.slice(0, -1)}${lastCharacter}`;
  assert.equal(verifySessionToken(tamperedToken), null);
});

test("rejeita payload de sessão sem identificador", () => {
  const token = createSessionToken({ sub: "", role: "partner" });
  assert.equal(verifySessionToken(token), null);
});
