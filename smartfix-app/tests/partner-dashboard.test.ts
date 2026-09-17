import assert from "node:assert/strict";
import test from "node:test";
import { summarizePartnerWork, type DashboardNotification } from "../src/services/partner-dashboard.service.ts";
import type { OrderStatus, RepairOrder } from "../src/types/workflow.ts";

function order(id: string, status: OrderStatus, createdAt: string): RepairOrder {
  return { id, status, createdAt, clientId: "client", partnerId: "partner", deviceId: "device", device: "Aparelho", problem: "Defeito", symptoms: [], checklist: [], quote: [], diagnosis: "", history: [], review: null };
}

const notification = (id: string, read: boolean): DashboardNotification => ({
  id, data: { message: "Aviso", href: "/parceiro/ordens", read, createdAt: "2026-09-17T10:00:00Z" },
});

test("resume ordens do parceiro e prioriza solicitações com ações disponíveis", () => {
  const result = summarizePartnerWork([
    order("old", "pending", "2026-09-15T10:00:00Z"),
    order("new", "pending", "2026-09-17T10:00:00Z"),
    order("quote", "quoted", "2026-09-16T10:00:00Z"),
    order("repair", "in_progress", "2026-09-16T11:00:00Z"),
    order("done", "completed", "2026-09-14T10:00:00Z"),
  ], [notification("one", false), notification("two", true)]);
  assert.deepEqual({ total: result.total, pending: result.pending, awaitingApproval: result.awaitingApproval, active: result.active, unread: result.unread },
    { total: 5, pending: 2, awaitingApproval: 1, active: 1, unread: 1 });
  assert.deepEqual(result.requests.map(({ id }) => id), ["new", "repair", "old"]);
});

test("mostra estado vazio sem contadores fictícios", () => {
  const result = summarizePartnerWork([], []);
  assert.equal(result.pending, 0);
  assert.equal(result.unread, 0);
  assert.deepEqual(result.requests, []);
});
