import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/src/errors/AppError";
import { actorFrom, accountById } from "@/src/services/account.service";
import { checkoutInput, confirmOrderPayment, prepareOrderPayment, quoteTotal } from "@/src/services/order-policy.service";
import { createPreference, getPayment } from "@/src/services/mercado-pago.service";
import { withWorkflow } from "@/src/services/workflow.service";
import type { RepairOrder } from "@/src/types/workflow";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function ok(data: unknown) { return noStoreResponse(NextResponse.json({ success: true, data })); }
function orderFrom(data: Record<string, unknown>) { return data as unknown as RepairOrder; }

async function confirmPayment(paymentId: string, expectedClientId?: string) {
  const payment = await getPayment(paymentId);
  if (payment.status !== "approved" || !payment.external_reference) return false;
  const orderId = z.uuid().parse(payment.external_reference);
  return withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" && item.id === orderId);
    if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const order = orderFrom(record.data);
    if (expectedClientId && order.clientId !== expectedClientId) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const total = quoteTotal(order.quote, order.serviceDetails.deliveryFeeCents, order.serviceDetails.discountCents);
    if (Math.round(payment.transaction_amount * 100) !== total)
      throw new AppError("O valor confirmado pelo provedor é inválido.", 409, "PAYMENT_AMOUNT_MISMATCH");
    const method = payment.payment_type_id === "credit_card" || payment.payment_type_id === "debit_card" ? "card" : "pix";
    const changed = confirmOrderPayment(order, String(payment.id), method);
    record.data = { ...order };
    return changed;
  }, true);
}

export class PaymentController {
  static async checkout(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Apenas clientes podem pagar uma O.S.", 403, "FORBIDDEN");
      const input = z.object({ orderId: z.uuid() }).extend(checkoutInput.shape).parse(await request.json());
      const account = await accountById(actor.sub, "client");
      if (!account) throw new AppError("Cliente não encontrado.", 404, "NOT_FOUND");
      const prepared = await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === input.orderId);
        if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const order = orderFrom(record.data);
        const totalCents = prepareOrderPayment(order, actor.sub, input);
        record.data = { ...order };
        return { order, totalCents };
      }, true);
      const preference = await createPreference({ orderId: input.orderId, title: `Reparo SmartFix — ${prepared.order.device}`, totalCents: prepared.totalCents, payerEmail: account.email });
      await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === input.orderId);
        if (record) orderFrom(record.data).serviceDetails.paymentPreferenceId = preference.id;
      }, true);
      return ok(preference);
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async confirm(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Acesso negado.", 403, "FORBIDDEN");
      const paymentId = z.string().regex(/^\d+$/).parse(request.nextUrl.searchParams.get("paymentId"));
      const confirmed = await confirmPayment(paymentId, actor.sub);
      if (!confirmed)
        throw new AppError("O pagamento ainda não foi aprovado pelo provedor.", 409, "PAYMENT_NOT_APPROVED");
      return ok({ confirmed });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async webhook(request: NextRequest) {
    try {
      const body = z.object({ type: z.string().optional(), data: z.object({ id: z.union([z.string(), z.number()]) }) }).parse(await request.json());
      const dataId = String(body.data.id);
      const signature = request.headers.get("x-signature") || "";
      const requestId = request.headers.get("x-request-id") || "";
      const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
      if (!secret || !parts.ts || !parts.v1 || !requestId) throw new AppError("Assinatura inválida.", 401, "INVALID_WEBHOOK");
      const expected = createHmac("sha256", secret).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`).digest("hex");
      const valid = expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
      if (!valid) throw new AppError("Assinatura inválida.", 401, "INVALID_WEBHOOK");
      if (body.type === "payment") await confirmPayment(dataId);
      return ok({ received: true });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
