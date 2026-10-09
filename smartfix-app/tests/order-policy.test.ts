import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import {
  applyOrderAction,
  confirmOrderPayment,
  orderAction,
  orderInput,
  prepareOrderPayment,
  quoteTotal,
} from "../src/services/order-policy.service";
import { openFlow, sealFlow } from "../src/services/auth-flow.service";
import { profileInput } from "../src/validations/profile.validation";
import type { RepairOrder } from "../src/types/workflow";
function order(): RepairOrder {
  return {
    id: randomUUID(),
    clientId: "client",
    partnerId: "partner",
    deviceId: randomUUID(),
    device: "Celular",
    problem: "Não liga nem carrega",
    symptoms: [],
    checklist: [],
    quote: [],
    diagnosis: "",
    serviceDetails: { estimatedDays: 3, warrantyDays: 90, deliveryFeeCents: 0, couponCode: "", discountCents: 0, scheduledDate: "",
      schedulePeriod: "", serviceAddress: "", paymentMethod: "", paymentStatus: "pending", paidAt: "" },
    status: "pending",
    history: [],
    review: null,
    createdAt: new Date().toISOString(),
  };
}
test("orçamento, transições e avaliação respeitam o proprietário e o papel", () => {
  const current = order();
  const client = { sub: "client", role: "client" };
  const partner = { sub: "partner", role: "partner" };
  assert.throws(() => prepareOrderPayment(current, "other", { scheduledDate: "2099-01-01",
    schedulePeriod: "morning", serviceAddress: "Rua Teste, 123", couponCode: "" }));
  assert.throws(() =>
    applyOrderAction(current, client, {
      action: "status",
      status: "completed",
    }),
  );
  const quote = orderAction.parse({
    action: "quote",
    diagnosis: "Troca de bateria",
    estimatedDays: 3, warrantyDays: 90, deliveryFeeCents: 0,
    items: [{ name: "Bateria", category: "part", details: "", quantity: 2, unitPriceCents: 1001 }],
  });
  applyOrderAction(current, partner, quote);
  assert.equal(quoteTotal(current.quote), 2002);
  assert.throws(() => prepareOrderPayment(current, partner.sub, { scheduledDate: "2099-01-01",
    schedulePeriod: "morning", serviceAddress: "Rua Teste, 123", couponCode: "" }));
  prepareOrderPayment(current, client.sub, { scheduledDate: "2099-01-01",
    schedulePeriod: "morning", serviceAddress: "Rua Teste, 123", couponCode: "" });
  assert.equal(confirmOrderPayment(current, "payment-1", "pix"), true);
  assert.throws(() => applyOrderAction(current, partner, quote));
  assert.throws(() => applyOrderAction(current, client, { action: "cancel" }));
  applyOrderAction(current, partner, {
    action: "status",
    status: "in_progress",
  });
  applyOrderAction(current, partner, {
    action: "status",
    status: "waiting_parts",
  });
  assert.throws(() =>
    applyOrderAction(current, partner, {
      action: "status",
      status: "completed",
    }),
  );
  applyOrderAction(current, partner, {
    action: "status",
    status: "in_progress",
  });
  applyOrderAction(current, partner, { action: "status", status: "ready" });
  applyOrderAction(current, partner, { action: "status", status: "completed" });
  applyOrderAction(current, client, {
    action: "review",
    rating: 5,
    comment: "Resolvido",
  });
  assert.throws(() =>
    applyOrderAction(current, client, {
      action: "review",
      rating: 1,
      comment: "",
    }),
  );
  assert.equal(current.history.length, 7);
});
test("entrada rejeita valores negativos, fracionários, documentos arbitrários e campos de perfil privilegiados", () => {
  assert.equal(
    orderAction.safeParse({
      action: "quote",
      diagnosis: "Teste",
      items: [{ name: "Peça", quantity: 1, unitPriceCents: -1 }],
    }).success,
    false,
  );
  assert.equal(
    orderAction.safeParse({
      action: "quote",
      diagnosis: "Teste",
      items: [{ name: "Peça", quantity: 1.5, unitPriceCents: 100 }],
    }).success,
    false,
  );
  assert.equal(
    orderInput.safeParse({
      deviceId: randomUUID(),
      partnerId: randomUUID(),
      problem: "Não carrega mais",
      symptoms: ["inventado"],
    }).success,
    false,
  );
  assert.equal(
    profileInput.safeParse({
      nome: "Cliente Teste",
      telefone: "11999999999",
      role: "admin",
    }).success,
    false,
  );
});
test("somente o parceiro responsável altera os dados operacionais internos", () => {
  const current = order();
  const operations = orderAction.parse({ action: "operations", technicianName: "Ana Técnica", promisedDate: "2099-02-10", internalNotes: "Peça reservada na bancada 2." });
  assert.throws(() => applyOrderAction(current, { sub: "client", role: "client" }, operations));
  assert.throws(() => applyOrderAction(current, { sub: "other", role: "partner" }, operations));
  applyOrderAction(current, { sub: "partner", role: "partner" }, operations);
  assert.equal(current.serviceDetails.technicianName, "Ana Técnica");
  assert.equal(current.serviceDetails.promisedDate, "2099-02-10");
  assert.equal(current.serviceDetails.internalNotes, "Peça reservada na bancada 2.");
  assert.equal(current.status, "pending");
});
test("impede orçamento sem valor e alteração depois do início do checkout", () => {
  const partner = { sub: "partner", role: "partner" };
  const zero = order();
  assert.throws(
    () => applyOrderAction(zero, partner, orderAction.parse({
      action: "quote",
      diagnosis: "Teste funcional",
      estimatedDays: 2,
      warrantyDays: 90,
      deliveryFeeCents: 0,
      items: [{ name: "Diagnóstico", category: "labor", details: "", quantity: 1, unitPriceCents: 0 }],
    })),
    { code: "INVALID_QUOTE_TOTAL" },
  );
  const locked = order();
  locked.serviceDetails.paymentPreferenceId = "pref-1";
  assert.throws(
    () => applyOrderAction(locked, partner, orderAction.parse({
      action: "quote",
      diagnosis: "Troca necessária",
      estimatedDays: 2,
      warrantyDays: 90,
      deliveryFeeCents: 0,
      items: [{ name: "Serviço", category: "labor", details: "", quantity: 1, unitPriceCents: 1000 }],
    })),
    { code: "CHECKOUT_ALREADY_STARTED" },
  );
});
test("recusa exige motivo e ordens encerradas não aceitam gestão interna", () => {
  const partner = { sub: "partner", role: "partner" };
  const rejected = order();
  assert.equal(orderAction.safeParse({ action: "reject", reason: "curto" }).success, false);
  applyOrderAction(rejected, partner, orderAction.parse({
    action: "reject",
    reason: "Modelo fora da cobertura técnica da assistência.",
  }));
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.serviceDetails.rejectionReason, "Modelo fora da cobertura técnica da assistência.");
  assert.throws(() => applyOrderAction(rejected, partner, orderAction.parse({
    action: "operations",
    technicianName: "Ana",
    promisedDate: "",
    internalNotes: "Alteração tardia",
  })), { code: "INVALID_TRANSITION" });
});
test("prazo operacional não pode estar no passado", () => {
  const current = order();
  assert.throws(() => applyOrderAction(current, { sub: "partner", role: "partner" }, orderAction.parse({
    action: "operations",
    technicianName: "Ana",
    promisedDate: "2000-01-01",
    internalNotes: "Prazo inválido",
  })), { code: "INVALID_PROMISED_DATE" });
});
test("estado OAuth adulterado ou expirado não é aceito", () => {
  process.env.SESSION_SECRET = "test-oauth-secret-at-least-32-characters";
  const sealed = sealFlow({ state: "nonce", verifier: "challenge" });
  assert.equal(openFlow(sealed)?.state, "nonce");
  assert.equal(openFlow(sealed + "tampered"), null);
  assert.equal(openFlow("invalid"), null);
  const realNow = Date.now;
  Date.now = () => realNow() + 700_000;
  try {
    assert.equal(openFlow(sealed), null);
  } finally {
    Date.now = realNow;
  }
});
