import assert from "node:assert/strict";
import test from "node:test";

test("gera autorização OAuth no endpoint atual com PKCE protegido", async () => {
  const previous = {
    clientId: process.env.MERCADO_PAGO_CLIENT_ID,
    publicUrl: process.env.PAYMENT_PUBLIC_URL,
    stateSecret: process.env.MERCADO_PAGO_OAUTH_STATE_SECRET,
  };
  process.env.MERCADO_PAGO_CLIENT_ID = "123456";
  process.env.PAYMENT_PUBLIC_URL = "https://smartfix.example";
  process.env.MERCADO_PAGO_OAUTH_STATE_SECRET = "oauth-state-secret-with-at-least-32-characters";
  try {
    const { mercadoPagoAuthorizationUrl, readOAuthState } = await import("../src/services/mercado-pago.service");
    const url = new URL(mercadoPagoAuthorizationUrl("partner-123"));
    assert.equal(url.origin, "https://auth.mercadopago.com");
    assert.equal(url.pathname, "/authorization");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.ok(url.searchParams.get("code_challenge"));
    const state = url.searchParams.get("state")!;
    assert.equal(state.includes("partner-123"), false);
    const parsed = readOAuthState(state);
    assert.equal(parsed.partnerId, "partner-123");
    assert.ok(parsed.codeVerifier.length >= 43);
  } finally {
    if (previous.clientId === undefined) delete process.env.MERCADO_PAGO_CLIENT_ID;
    else process.env.MERCADO_PAGO_CLIENT_ID = previous.clientId;
    if (previous.publicUrl === undefined) delete process.env.PAYMENT_PUBLIC_URL;
    else process.env.PAYMENT_PUBLIC_URL = previous.publicUrl;
    if (previous.stateSecret === undefined) delete process.env.MERCADO_PAGO_OAUTH_STATE_SECRET;
    else process.env.MERCADO_PAGO_OAUTH_STATE_SECRET = previous.stateSecret;
  }
});

test("cria preferência marketplace com split de 10%", async (t) => {
  const previousPublicUrl = process.env.PAYMENT_PUBLIC_URL;
  process.env.PAYMENT_PUBLIC_URL = "https://smartfix.example/path-ignored";
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://api.mercadopago.com/checkout/preferences");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer seller-access-token");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.marketplace_fee, 12.35);
    assert.equal(body.external_reference, "123");
    assert.equal(body.notification_url, "https://smartfix.example/api/payments/mercado-pago/webhook?order=123");
    return Response.json({ id: "preference-1", init_point: "https://www.mercadopago.com/checkout/v1/redirect?pref_id=preference-1" });
  });
  try {
    const { createPreference } = await import("../src/services/mercado-pago.service");
    assert.deepEqual(await createPreference({ orderId: "123", title: "Reparo SmartFix", totalCents: 12_345,
      payerEmail: "cliente@example.com", accessToken: "seller-access-token" }), {
      id: "preference-1", checkoutUrl: "https://www.mercadopago.com/checkout/v1/redirect?pref_id=preference-1",
      marketplaceFeeCents: 1235,
    });
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    if (previousPublicUrl === undefined) delete process.env.PAYMENT_PUBLIC_URL;
    else process.env.PAYMENT_PUBLIC_URL = previousPublicUrl;
  }
});
