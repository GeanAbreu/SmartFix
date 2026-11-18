import assert from "node:assert/strict";
import test from "node:test";

test("reembolso usa o pagamento do parceiro", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://api.mercadopago.com/v1/payments/PAY123/refunds");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer seller-access-token");
    assert.deepEqual(JSON.parse(String(init?.body)), { amount: 10.5 });
    return Response.json({ id: "REF99", amount: 10.5, status: "approved" });
  });
  const { refundPayment } = await import("../src/services/mercado-pago.service");
  assert.deepEqual(await refundPayment({ paymentId: "PAY123", accessToken: "seller-access-token", amountCents: 1050 }),
    { id: "REF99", amountCents: 1050, status: "approved" });
  assert.equal(fetchMock.mock.callCount(), 1);
});
