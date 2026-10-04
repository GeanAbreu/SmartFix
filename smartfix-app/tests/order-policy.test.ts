import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import {
  applyOrderAction,
  orderAction,
  orderInput,
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
  assert.throws(() =>
    applyOrderAction(
      current,
      { sub: "other", role: "client" },
      { action: "approve", scheduledDate: "2099-01-01", schedulePeriod: "morning",
        serviceAddress: "Rua Teste, 123", paymentMethod: "pix", couponCode: "" },
    ),
  );
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
  assert.throws(() =>
    applyOrderAction(current, partner, { action: "approve", scheduledDate: "2099-01-01",
      schedulePeriod: "morning", serviceAddress: "Rua Teste, 123", paymentMethod: "pix", couponCode: "" }),
  );
  applyOrderAction(current, client, { action: "approve", scheduledDate: "2099-01-01",
    schedulePeriod: "morning", serviceAddress: "Rua Teste, 123", paymentMethod: "pix", couponCode: "" });
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
