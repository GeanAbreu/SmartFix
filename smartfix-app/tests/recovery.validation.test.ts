import assert from "node:assert/strict";
import test from "node:test";
import { recoveryCodeInput, resetInput } from "../src/controllers/RecoveryController";

test("aceita somente código de recuperação com seis dígitos", () => {
  assert.equal(recoveryCodeInput.safeParse({ email: "pessoa@example.com", code: "123456" }).success, true);
  assert.equal(recoveryCodeInput.safeParse({ email: "pessoa@example.com", code: "12345" }).success, false);
  assert.equal(recoveryCodeInput.safeParse({ email: "pessoa@example.com", code: "12345a" }).success, false);
});

test("exige token seguro e senha forte na redefinição", () => {
  assert.equal(resetInput.safeParse({ token: "ab".repeat(32), password: "NovaSenha@456" }).success, true);
  assert.equal(resetInput.safeParse({ token: "curto", password: "NovaSenha@456" }).success, false);
  assert.equal(resetInput.safeParse({ token: "ab".repeat(32), password: "sem-simbolo" }).success, false);
});
