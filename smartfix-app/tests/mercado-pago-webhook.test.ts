import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";

test("webhook valida a assinatura usando data.id da query string", async () => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "webhook-secret";
  const dataId = "987654321";
  const requestId = "request-123";
  const timestamp = "1742505638683";
  const signature = createHmac("sha256", "webhook-secret")
    .update(`id:${dataId};request-id:${requestId};ts:${timestamp};`)
    .digest("hex");

  try {
    const { PaymentController } = await import("../src/controllers/PaymentController");
    const response = await PaymentController.webhook(new NextRequest(
      `https://smartfix.example/api/payments/mercado-pago/webhook?data.id=${dataId}&type=merchant_order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
          "x-signature": `ts=${timestamp},v1=${signature}`,
        },
        body: JSON.stringify({ type: "merchant_order", data: { id: dataId } }),
      },
    ));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, data: { received: true } });
  } finally {
    if (previousSecret === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    else process.env.MERCADO_PAGO_WEBHOOK_SECRET = previousSecret;
  }
});

test("webhook rejeita divergência entre data.id da query e do corpo", async () => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "webhook-secret";
  try {
    const { PaymentController } = await import("../src/controllers/PaymentController");
    const response = await PaymentController.webhook(new NextRequest(
      "https://smartfix.example/api/payments/mercado-pago/webhook?data.id=123&type=payment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "456" } }),
      },
    ));
    assert.equal(response.status, 400);
  } finally {
    if (previousSecret === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    else process.env.MERCADO_PAGO_WEBHOOK_SECRET = previousSecret;
  }
});
