import assert from "node:assert/strict";
import test from "node:test";

test("cria preferência marketplace com split de 14%", async (t) => {
  const previousPublicUrl = process.env.PAYMENT_PUBLIC_URL;
  process.env.PAYMENT_PUBLIC_URL = "https://smartfix.example/path-ignored";
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://api.mercadopago.com/checkout/preferences");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer seller-access-token");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.marketplace_fee, 17.28);
    assert.equal(body.external_reference, "123");
    assert.equal(body.notification_url, "https://smartfix.example/api/payments/mercado-pago/webhook?order=123");
    return Response.json({ id: "preference-1", init_point: "https://www.mercadopago.com/checkout/v1/redirect?pref_id=preference-1" });
  });
  try {
    const { createPreference } = await import("../src/services/mercado-pago.service");
    assert.deepEqual(await createPreference({ orderId: "123", title: "Reparo SmartFix", totalCents: 12_345,
      payerEmail: "cliente@example.com", accessToken: "seller-access-token" }), {
      id: "preference-1", checkoutUrl: "https://www.mercadopago.com/checkout/v1/redirect?pref_id=preference-1",
      marketplaceFeeCents: 1728,
    });
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    if (previousPublicUrl === undefined) delete process.env.PAYMENT_PUBLIC_URL;
    else process.env.PAYMENT_PUBLIC_URL = previousPublicUrl;
  }
});
