import assert from "node:assert/strict";
import test from "node:test";
import { initialRepairRequestDraft } from "../src/services/repair-request-draft";
import type { ClientDevice } from "../src/types/api";

const devices = [
  { id: "first", issueType: "Tela quebrada" },
  { id: "second", issueType: "Não carrega" },
] as ClientDevice[];
const partners = [{ id: "one" }, { id: "two" }];

test("preserva o rascunho ao voltar para o mesmo aparelho", () => {
  const draft = initialRepairRequestDraft(devices, partners, {
    deviceId: "first", partnerId: "one", problem: "A tela parou de responder", symptoms: ["Tela quebrada / sem imagem"], checklist: [],
  }, "", "");
  assert.equal(draft.deviceId, "first");
  assert.equal(draft.problem, "A tela parou de responder");
  assert.deepEqual(draft.symptoms, ["Tela quebrada / sem imagem"]);
});

test("prioriza o aparelho e a assistência escolhidos na navegação", () => {
  const draft = initialRepairRequestDraft(devices, partners, {
    deviceId: "first", partnerId: "one", problem: "Problema do aparelho anterior", symptoms: ["inválido"],
  }, "second", "two");
  assert.equal(draft.deviceId, "second");
  assert.equal(draft.partnerId, "two");
  assert.equal(draft.problem, "Não carrega");
  assert.deepEqual(draft.symptoms, []);
});

test("ignora rascunho inválido e preenche o tipo de problema do aparelho", () => {
  const draft = initialRepairRequestDraft(devices, partners, null, "", "");
  assert.equal(draft.deviceId, "first");
  assert.equal(draft.problem, "Tela quebrada");
  assert.equal(draft.partnerId, "");
});
