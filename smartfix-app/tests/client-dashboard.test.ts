import assert from "node:assert/strict";
import test from "node:test";
import { summarizeClientOrders } from "../src/services/client-dashboard.service";
import type { OrderStatus, RepairOrder } from "../src/types/workflow";

function order(id: string, status: OrderStatus, createdAt: string, reviewed = false): RepairOrder {
  return { id, status, createdAt, clientId: "client", partnerId: "partner", deviceId: "device",
    device: "Aparelho", problem: "Defeito", symptoms: [], checklist: [], quote: [], diagnosis: "",
    history: [], review: reviewed ? { rating: 5, comment: "" } : null };
}

test("destaca orçamento, retirada e avaliação antes dos reparos recentes", () => {
  const result = summarizeClientOrders([
    order("pending", "pending", "2026-09-17T12:00:00Z"),
    order("done", "completed", "2026-09-16T12:00:00Z"),
    order("quoted", "quoted", "2026-09-15T12:00:00Z"),
    order("ready", "ready", "2026-09-17T11:00:00Z"),
    order("reviewed", "completed", "2026-09-14T12:00:00Z", true),
  ]);
  assert.deepEqual({ active: result.active, awaitingApproval: result.awaitingApproval, completed: result.completed },
    { active: 3, awaitingApproval: 1, completed: 2 });
  assert.deepEqual(result.attention.map(({ id }) => id), ["quoted", "ready", "done"]);
  assert.deepEqual(result.recent.map(({ id }) => id), ["pending", "reviewed"]);
});

test("mantém indicadores e listas vazios sem pedidos", () => {
  const result = summarizeClientOrders([]);
  assert.equal(result.active, 0);
  assert.equal(result.attentionCount, 0);
  assert.deepEqual(result.recent, []);
});
