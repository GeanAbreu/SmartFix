import assert from "node:assert/strict";
import test from "node:test";

test("reembolso usa endpoint protegido e chave idempotente", async (t) => {
  const previous = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-access-token";
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://api.mercadopago.com/v1/payments/123/refunds");
    assert.equal(new Headers(init?.headers).get("X-Idempotency-Key"), "refund-key");
    assert.deepEqual(JSON.parse(String(init?.body)), { amount: 10.5 });
    return Response.json({ id: 99, payment_id: 123, amount: 10.5, status: "approved" });
  });
  try {
    const { refundPayment } = await import("../src/services/mercado-pago.service");
    assert.deepEqual(await refundPayment({ paymentId: "123", idempotencyKey: "refund-key", amountCents: 1050 }),
      { id: "99", amountCents: 1050, status: "approved" });
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    if (previous === undefined) delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    else process.env.MERCADO_PAGO_ACCESS_TOKEN = previous;
  }
});
