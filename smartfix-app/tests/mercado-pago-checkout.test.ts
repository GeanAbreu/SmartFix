import assert from "node:assert/strict";
import test from "node:test";

test("cria preferência de checkout com retorno, webhook e idempotência", async (t) => {
  const previousToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const previousPublicUrl = process.env.PAYMENT_PUBLIC_URL;
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-access-token";
  process.env.PAYMENT_PUBLIC_URL = "https://smartfix.example/path-ignored";

  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://api.mercadopago.com/v1/orders");
    assert.equal(init?.method, "POST");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer test-access-token");
    assert.match(headers.get("X-Idempotency-Key") || "", /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.deepEqual(JSON.parse(String(init?.body)), {
      type: "online",
      processing_mode: "manual",
      capture_mode: "automatic_async",
      total_amount: "123.45",
      items: [{ external_code: "order-123", title: "Reparo SmartFix", quantity: 1, unit_price: "123.45" }],
      payer: { email: "cliente@example.com" },
      external_reference: "order-123",
      config: { online: {
        success_url: "https://smartfix.example/cliente/ordens?payment=success&order=order-123",
        pending_url: "https://smartfix.example/cliente/ordens?payment=pending&order=order-123",
        failure_url: "https://smartfix.example/cliente/ordens?payment=failure&order=order-123",
        auto_return: "approved",
      } },
    });
    return Response.json({ id: "order-provider-1", checkout_url: "https://www.mercadopago.com/checkout/v1/redirect?order_id=order-provider-1" });
  });

  try {
    const { createPreference } = await import("../src/services/mercado-pago.service");
    assert.deepEqual(await createPreference({
      orderId: "order-123",
      title: "Reparo SmartFix",
      totalCents: 12_345,
      payerEmail: "cliente@example.com",
    }), {
      id: "order-provider-1",
      checkoutUrl: "https://www.mercadopago.com/checkout/v1/redirect?order_id=order-provider-1",
    });
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    if (previousToken === undefined) delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    else process.env.MERCADO_PAGO_ACCESS_TOKEN = previousToken;
    if (previousPublicUrl === undefined) delete process.env.PAYMENT_PUBLIC_URL;
    else process.env.PAYMENT_PUBLIC_URL = previousPublicUrl;
  }
});
