import assert from "node:assert/strict";
import test from "node:test";
import { collectionScheduleLabel } from "../src/services/order-display.service";

test("formata a coleta de uma ordem atual", () => {
  assert.equal(collectionScheduleLabel("2026-11-21", "morning"), "21/11/2026 · Manhã");
  assert.equal(collectionScheduleLabel("2026-11-21", "afternoon"), "21/11/2026 · Tarde");
});

test("não derruba a página quando uma ordem legada não tem agendamento", () => {
  assert.equal(collectionScheduleLabel(undefined, undefined), "Coleta a agendar");
  assert.equal(collectionScheduleLabel("", ""), "Coleta a agendar");
  assert.equal(collectionScheduleLabel("data-inválida", "morning"), "Coleta a agendar");
});

test("preserva uma data válida mesmo quando o turno ainda não existe", () => {
  assert.equal(collectionScheduleLabel("2026-11-21", undefined), "21/11/2026 · Turno a definir");
});
