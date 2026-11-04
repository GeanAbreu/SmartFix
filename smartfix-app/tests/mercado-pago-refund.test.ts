import assert from "node:assert/strict";
import test from "node:test";

test("reembolso usa a order, a transação e chave idempotente", async (t) => {
  const previous = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-access-token";
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://api.mercadopago.com/v1/orders/ORD123/refund");
    assert.match(new Headers(init?.headers).get("X-Idempotency-Key") || "", /^[0-9a-f-]{36}$/);
    assert.deepEqual(JSON.parse(String(init?.body)), { transactions: [{ id: "PAY123", amount: "10.50" }] });
    return Response.json({ id: "ORD123", status: "refunded", status_detail: "partially_refunded",
      transactions: { refunds: [{ id: "REF99", amount: "10.50", status: "processed" }] } });
  });
  try {
    const { refundOrder } = await import("../src/services/mercado-pago.service");
    assert.deepEqual(await refundOrder({ orderId: "ORD123", transactionId: "PAY123",
      idempotencyKey: "refund-key", totalCents: 5000, amountCents: 1050 }),
      { id: "REF99", amountCents: 1050, status: "processed" });
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    if (previous === undefined) delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    else process.env.MERCADO_PAGO_ACCESS_TOKEN = previous;
  }
});
