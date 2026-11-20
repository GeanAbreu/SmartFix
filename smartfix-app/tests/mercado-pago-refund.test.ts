import assert from "node:assert/strict";
import test from "node:test";

test("reembolso usa o pagamento do parceiro", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://api.mercadopago.com/v1/orders/ORDER123/refund");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer seller-access-token");
    assert.deepEqual(JSON.parse(String(init?.body)), { transactions: [{ id: "PAY123", amount: "10.50" }] });
    return Response.json({ id: "ORDER123", status: "processed",
      transactions: { refunds: [{ id: "REF99", amount: "10.50", status: "processed" }] } });
  });
  const { refundPayment } = await import("../src/services/mercado-pago.service");
  assert.deepEqual(await refundPayment({ orderId: "ORDER123", paymentId: "PAY123", totalCents: 5000,
    accessToken: "seller-access-token", amountCents: 1050 }),
    { id: "REF99", amountCents: 1050, status: "processed" });
  assert.equal(fetchMock.mock.callCount(), 1);
});
