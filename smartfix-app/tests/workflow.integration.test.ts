import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { createSessionToken } from "../src/services/session.service";

test("integra persistência, isolamento, aprovação, triagem, orçamento, notificações, perfil e recuperação", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "smartfix-test-"));
  const previousEnv = { ...process.env };
  Object.assign(process.env, {
    NODE_ENV: "development",
    SMARTFIX_LOCAL_AUTH: "true",
    SESSION_SECRET: "integration-test-secret-of-at-least-32-characters",
    APP_URL: "http://localhost:3000",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  });
  process.env.SMARTFIX_LOCAL_DATA_DIR = directory;
  delete process.env.DATABASE_URL;
  delete process.env.RESEND_API_KEY;
  delete process.env.WHATSAPP_PROVIDER;
  delete process.env.GOOGLE_CLIENT_ID;
  try {
    const store = await import("../src/services/local-auth.service");
    const { WorkflowController: controller } =
      await import("../src/controllers/WorkflowController");
    const { TrackingController } =
      await import("../src/controllers/TrackingController");
    const { PaymentController } =
      await import("../src/controllers/PaymentController");
    const { ClientController } =
      await import("../src/controllers/ClientController");
    const { RecoveryController } =
      await import("../src/controllers/RecoveryController");
    const { GoogleController } =
      await import("../src/controllers/GoogleController");
    const { withWorkflow } = await import("../src/services/workflow.service");
    const { digest } = await import("../src/services/auth-flow.service");
    const { verifyPassword } = await import("../src/services/password.service");
    async function user(role: "client" | "partner", email: string) {
      return store.createLocalUser({
        role,
        name: "Pessoa Teste",
        email,
        document: randomUUID(),
        passwordHash: "Senha@123",
        phone: "11999999999",
        birthDate: null,
        companyName: null,
        address: "Rua",
        city: "São Paulo",
        state: "SP",
        zipCode: "01001000",
      });
    }
    const client = await user("client", "client@example.test");
    const other = await user("client", "other@example.test");
    const partner = await user("partner", "partner@example.test");
    const request = (
      actor: typeof client | null,
      url: string,
      body?: unknown,
      method = "POST",
    ) =>
      new NextRequest(`http://localhost:3000${url}`, {
        method: body === undefined ? "GET" : method,
        headers: {
          ...(actor
            ? {
                cookie: `smartfix_session=${createSessionToken({ sub: actor.id, role: actor.role })}`,
              }
            : {}),
          "Content-Type": "application/json",
          origin: "http://localhost:3000",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    assert.equal(
      (await controller.list(request(null, "/api/orders"))).status,
      401,
    );
    assert.equal(
      (
        await controller.approvePartner(
          request(client, "/api/partners/id/approval", { verified: true }),
          partner.id,
        )
      ).status,
      403,
    );
    process.env.ADMIN_USER_IDS = client.id;
    const approved = await controller.approvePartner(
      request(client, "/api/partners/id/approval", { verified: true }),
      partner.id,
    );
    assert.equal(approved.status, 200);
    assert.equal((await approved.json()).data.emailStatus, "not_configured");
    const device = await store.createLocalDevice(client.id, {
      tipo: "Smartphone",
      marca: "Apple",
      modelo: "iPhone 15",
      fotoUrl: "https://example.test/photo.png",
      apelido: "Pessoal",
      issueDescription: "Não liga",
    });
    assert.equal((await store.listLocalDevices(client.id))[0]?.issueDescription, "Não liga");
    const input = {
      deviceId: device.id,
      partnerId: partner.id,
      problem: "Não liga nem carrega",
      symptoms: ["Não liga / não carrega"],
      checklist: [],
    };
    assert.equal(
      (await controller.create(request(other, "/api/orders", input))).status,
      404,
    );
    const created = await controller.create(
      request(client, "/api/orders", input),
    );
    assert.equal(created.status, 201);
    const order = (await created.json()).data.order;
    assert.equal((await TrackingController.issue(request(other, `/api/orders/${order.id}/tracking-link`, {}), order.id)).status, 404);
    const trackingLink = await TrackingController.issue(request(client, `/api/orders/${order.id}/tracking-link`, {}), order.id);
    assert.equal(trackingLink.status, 200);
    const trackingPath = (await trackingLink.json()).data.path as string;
    assert.match(trackingPath, /^\/tracking\/[A-Za-z0-9_-]{43}$/);
    const publicTracking = await TrackingController.show(trackingPath.split("/").at(-1)!);
    assert.equal(publicTracking.status, 200);
    const publicPayload = (await publicTracking.json()).data.tracking;
    assert.equal(publicPayload.device, "Apple iPhone 15");
    assert.equal(publicPayload.status, "pending");
    assert.equal(publicPayload.problem, undefined);
    assert.equal(publicPayload.serviceDetails, undefined);
    assert.equal(publicPayload.realtime.url, "https://example.supabase.co");
    assert.match(publicPayload.realtime.topic, /^tracking:[a-f0-9]{64}$/);
    assert.equal(publicPayload.realtime.topic.includes(trackingPath.split("/").at(-1)!), false);
    assert.equal(publicTracking.headers.get("cache-control"), "no-store, max-age=0");
    assert.equal(publicTracking.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
    await assert.rejects(store.deleteLocalDevice(client.id, device.id), { code: "DEVICE_IN_USE" });
    assert.equal(
      (await (await controller.list(request(other, "/api/orders"))).json()).data
        .orders.length,
      0,
    );
    assert.equal(
      (
        await controller.update(
          request(other, "/api/orders", { action: "cancel" }, "PATCH"),
          order.id,
        )
      ).status,
      404,
    );
    const action = async (actor: typeof client, body: unknown) =>
      controller.update(request(actor, "/api/orders", body, "PATCH"), order.id);
    const quoted = await action(partner, {
      action: "quote",
      diagnosis: "Trocar bateria",
      estimatedDays: 3,
      warrantyDays: 90,
      deliveryFeeCents: 0,
      items: [{ name: "Bateria", quantity: 1, unitPriceCents: 19990 }],
    });
    assert.equal(quoted.status, 200);
    assert.equal((await quoted.json()).data.whatsappStatus, "not_configured");
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-token";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: 123,
      status: "pending",
      external_reference: order.id,
      transaction_amount: 199.9,
      payment_type_id: "pix",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    try {
      const pendingPayment = await PaymentController.confirm(
        request(client, "/api/payments/mercado-pago/confirm?paymentId=123"),
      );
      assert.equal(pendingPayment.status, 409);
      assert.equal((await pendingPayment.json()).code, "PAYMENT_NOT_APPROVED");
    } finally {
      globalThis.fetch = originalFetch;
    }
    const { prepareOrderPayment, confirmOrderPayment } = await import("../src/services/order-policy.service");
    await withWorkflow((records) => {
      const current = records.find((record) => record.id === order.id)!.data as unknown as import("../src/types/workflow").RepairOrder;
      prepareOrderPayment(current, client.id, { scheduledDate: "2099-01-01", schedulePeriod: "morning",
        serviceAddress: "Rua Teste, 123", couponCode: "SMART10" });
      confirmOrderPayment(current, "payment-test", "pix");
    }, true);
    const attempts = await Promise.all([
      action(partner, { action: "status", status: "in_progress" }),
      action(partner, { action: "status", status: "in_progress" }),
    ]);
    assert.deepEqual(
      attempts.map((response) => response.status).sort(),
      [200, 409],
    );
    assert.equal(
      (await action(partner, { action: "status", status: "ready" })).status,
      200,
    );
    assert.equal(
      (await action(partner, { action: "status", status: "completed" })).status,
      200,
    );
    const completedOrders = (await (await controller.list(request(client, "/api/orders"))).json()).data.orders;
    assert.equal(completedOrders[0].partnerName, partner.name);
    assert.equal(completedOrders[0].status, "completed");
    assert.equal(completedOrders[0].totalCents, 17991);
    assert.equal(completedOrders[0].serviceDetails.paymentStatus, "confirmed");
    assert.equal(completedOrders[0].serviceDetails.scheduledDate, "2099-01-01");
    assert.equal(completedOrders[0].review, null);
    assert.equal(
      (
        await action(client, {
          action: "review",
          rating: 5,
          comment: "Resolvido",
        })
      ).status,
      200,
    );
    const reviewedOrders = (await (await controller.list(request(client, "/api/orders"))).json()).data.orders;
    assert.deepEqual(reviewedOrders[0].review, { rating: 5, comment: "Resolvido" });
    assert.equal((await action(client, { action: "review", rating: 4, comment: "Novamente" })).status, 409);
    const notices = (
      await (
        await controller.notifications(request(client, "/api/notifications"))
      ).json()
    ).data.notifications;
    assert.ok(notices.length > 0);
    assert.equal(
      (
        await controller.readNotification(
          request(other, "/api/notifications", {}, "PATCH"),
          notices[0].id,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await ClientController.update(
          request(
            client,
            "/api/clients/me",
            { nome: "Nome Atualizado", telefone: "11988888888" },
            "PATCH",
          ),
        )
      ).status,
      200,
    );
    assert.equal(
      (await store.findLocalUserById(client.id))?.name,
      "Nome Atualizado",
    );
    const googleUnavailable = await GoogleController.start(
      request(null, "/api/auth/google"),
    );
    assert.equal(googleUnavailable.status, 307);
    assert.match(
      googleUnavailable.headers.get("location") || "",
      /GOOGLE_NOT_CONFIGURED/,
    );
    assert.equal(
      (
        await RecoveryController.request(
          request(null, "/api/auth/forgot-password", { email: client.email }),
        )
      ).status,
      503,
    );
    const recoveryCode = "123456";
    await withWorkflow((records) => {
      records.push({
        id: randomUUID(),
        kind: "reset",
        ownerId: client.id,
        data: {
          codeHash: digest(recoveryCode),
          passwordHash: digest("Senha@123"),
          role: "client",
          created: Date.now(),
          expires: Date.now() + 60000,
          attempts: 0,
          consumed: false,
        },
      });
    }, true);
    assert.equal((await RecoveryController.verifyCode(request(
      null,
      "/api/auth/verify-recovery-code",
      { email: client.email, code: "000000" },
    ))).status, 422);
    const verification = await RecoveryController.verifyCode(request(
      null,
      "/api/auth/verify-recovery-code",
      { email: client.email, code: recoveryCode },
    ));
    assert.equal(verification.status, 200);
    const token = (await verification.json()).data.token as string;
    const resetRequest = () =>
      request(null, "/api/auth/reset-password", {
        token,
        password: "NovaSenha@456",
      });
    const previousSession = request(client, "/api/orders");
    assert.equal((await RecoveryController.reset(resetRequest())).status, 200);
    assert.equal((await RecoveryController.reset(resetRequest())).status, 422);
    assert.equal((await controller.list(previousSession)).status, 401);
    assert.equal(
      (await controller.list(request(client, "/api/orders"))).status,
      200,
    );
    const updated = await store.findLocalUserById(client.id);
    assert.equal(
      await verifyPassword("NovaSenha@456", updated!.passwordHash),
      true,
    );
    const disk = JSON.parse(
      await readFile(path.join(directory, "auth.json"), "utf8"),
    );
    const savedOrder = disk.workflow.find(
      (record: { id: string }) => record.id === order.id,
    ).data;
    assert.equal(savedOrder.status, "completed");
    assert.equal(savedOrder.review.rating, 5);
    assert.equal(disk.devices[0].issueDescription, "Não liga");
    assert.equal(JSON.stringify(disk).includes(trackingPath.split("/").at(-1)!), false);
    await TrackingController.revoke(request(client, `/api/orders/${order.id}/tracking-link`, {}, "DELETE"), order.id);
    assert.equal((await TrackingController.show(trackingPath.split("/").at(-1)!)).status, 404);
  } finally {
    process.env = previousEnv;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith("smartfix-test-"));
    await rm(directory, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  }
});
