import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

test("valida assinatura e normaliza webhook moderno do Uber Direct", async () => {
  const previous = process.env.UBER_DIRECT_WEBHOOK_SECRET;
  process.env.UBER_DIRECT_WEBHOOK_SECRET = "webhook-test-secret";
  try {
    const { parseLogisticsWebhook, verifyLogisticsWebhook } = await import("../src/services/logistics.service");
    const raw = JSON.stringify({ id: "evt-1", event_time: 1_800_000_000,
      data: { id: "del-1", external_id: "smartfix-42-pickup", status: "DELIVERED",
        tracking_url: "https://example.test/tracking" } });
    const signature = createHmac("sha256", process.env.UBER_DIRECT_WEBHOOK_SECRET).update(raw).digest("hex");
    assert.equal(verifyLogisticsWebhook(raw, signature), true);
    assert.equal(verifyLogisticsWebhook(`${raw} `, signature), false);
    assert.deepEqual(parseLogisticsWebhook(raw), {
      eventId: "evt-1", deliveryId: "del-1", externalId: "smartfix-42-pickup",
      status: "delivered", trackingUrl: "https://example.test/tracking",
      occurredAt: "2027-01-15T08:00:00.000Z",
    });
  } finally {
    if (previous === undefined) delete process.env.UBER_DIRECT_WEBHOOK_SECRET;
    else process.env.UBER_DIRECT_WEBHOOK_SECRET = previous;
  }
});

test("rejeita webhook logístico incompleto", async () => {
  const { parseLogisticsWebhook } = await import("../src/services/logistics.service");
  assert.throws(() => parseLogisticsWebhook(JSON.stringify({ data: { id: "del-1" } })),
    { code: "INVALID_WEBHOOK" });
});
