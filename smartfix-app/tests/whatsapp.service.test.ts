import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeWhatsAppPhone,
  orderStatusWhatsAppMessage,
  sendWhatsAppText,
  whatsappConfigured,
} from "../src/services/whatsapp.service";

test("normaliza telefone brasileiro e monta mensagem de status", () => {
  assert.equal(normalizeWhatsAppPhone("(11) 99999-9999"), "5511999999999");
  assert.equal(normalizeWhatsAppPhone("+55 11 99999-9999"), "5511999999999");
  assert.equal(
    orderStatusWhatsAppMessage({
      clientName: "Maria Silva",
      orderId: "12345678-abcd-0000-0000-000000000000",
      device: "iPhone 15",
      status: "in_progress",
    }),
    "Olá, Maria! Sua OS #12345678 (iPhone 15) foi atualizada para: Em reparo.",
  );
});

test("envia o payload esperado para a Evolution API", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, {
    WHATSAPP_PROVIDER: "evolution",
    EVOLUTION_API_URL: "https://evolution.example.test/",
    EVOLUTION_API_KEY: "secret",
    EVOLUTION_INSTANCE: "smartfix",
  });
  t.after(() => {
    process.env = previous;
  });
  const fetchMock = t.mock.method(globalThis, "fetch", async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    assert.equal(String(input), "https://evolution.example.test/message/sendText/smartfix");
    assert.equal((init?.headers as Record<string, string>).apikey, "secret");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      number: "5511999999999",
      text: "Mensagem",
    });
    return new Response("{}", { status: 201 });
  });
  assert.equal(whatsappConfigured(), true);
  await sendWhatsAppText("11999999999", "Mensagem");
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("envia o payload esperado para a Z-API", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, {
    WHATSAPP_PROVIDER: "zapi",
    ZAPI_INSTANCE_ID: "instance-id",
    ZAPI_TOKEN: "token",
    ZAPI_CLIENT_TOKEN: "client-token",
  });
  t.after(() => {
    process.env = previous;
  });
  t.mock.method(globalThis, "fetch", async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    assert.equal(
      String(input),
      "https://api.z-api.io/instances/instance-id/token/token/send-text",
    );
    assert.equal(
      (init?.headers as Record<string, string>)["Client-Token"],
      "client-token",
    );
    assert.deepEqual(JSON.parse(String(init?.body)), {
      phone: "5511999999999",
      message: "Mensagem",
    });
    return new Response("{}", { status: 200 });
  });
  await sendWhatsAppText("11999999999", "Mensagem");
});
