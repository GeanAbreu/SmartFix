import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { databaseId } from "@/src/validations/database-id";
import { AppError } from "@/src/errors/AppError";
import { actorFrom, accountById } from "@/src/services/account.service";
import { requireAdministrator } from "@/src/services/admin.service";
import { checkoutInput, confirmOrderPayment, prepareOrderPayment, quoteTotal } from "@/src/services/order-policy.service";
import { createPreference, getPaymentOrder, marketplaceFeeCents, partnerAccessToken, refundPayment } from "@/src/services/mercado-pago.service";
import { nextWorkflowId, withWorkflow } from "@/src/services/workflow.service";
import type { RepairOrder } from "@/src/types/workflow";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function ok(data: unknown) { return noStoreResponse(NextResponse.json({ success: true, data })); }
function orderFrom(data: Record<string, unknown>) { return data as unknown as RepairOrder; }

async function confirmPayment(providerOrderId: string, expectedClientId?: string) {
  const checkout = await withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" &&
      orderFrom(item.data).serviceDetails.paymentPreferenceId === providerOrderId);
    if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const order = orderFrom(record.data);
    if (expectedClientId && order.clientId !== expectedClientId) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    return { orderId: order.id, partnerId: order.partnerId };
  });
  const payment = await getPaymentOrder(providerOrderId, await partnerAccessToken(checkout.partnerId));
  if (payment.status !== "processed" || payment.status_detail !== "accredited" || !payment.external_reference) return false;
  if (databaseId.parse(payment.external_reference) !== checkout.orderId)
    throw new AppError("O pagamento não pertence a esta O.S.", 409, "PAYMENT_ORDER_MISMATCH");
  return withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" && item.id === checkout.orderId);
    if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const order = orderFrom(record.data);
    if (expectedClientId && order.clientId !== expectedClientId) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const total = quoteTotal(order.quote, order.serviceDetails.deliveryFeeCents, order.serviceDetails.discountCents);
    if (payment.currency !== "BRL" || Math.round(Number(payment.total_paid_amount) * 100) !== total)
      throw new AppError("O valor confirmado pelo provedor é inválido.", 409, "PAYMENT_AMOUNT_MISMATCH");
    const transaction = payment.transactions?.payments?.find((item) =>
      item.status === "processed" && item.status_detail === "accredited");
    if (!transaction) throw new AppError("A transação aprovada não foi encontrada.", 409, "PAYMENT_NOT_APPROVED");
    const type = transaction.payment_method?.type;
    const method = type === "credit_card" || type === "debit_card" ? "card" : "pix";
    const changed = confirmOrderPayment(order, transaction.id, method);
    order.serviceDetails.marketplaceFeeCents = marketplaceFeeCents(total);
    order.serviceDetails.partnerGrossCents = total - order.serviceDetails.marketplaceFeeCents;
    record.data = { ...order };
    if (changed) records.push({ id: nextWorkflowId(records), kind: "notification", ownerId: order.partnerId,
      data: { message: `${order.device}: pagamento confirmado. A coleta já pode ser organizada.`,
        href: "/parceiro/ordens", read: false, createdAt: new Date().toISOString() } });
    return changed;
  }, true);
}

export class PaymentController {
  static async refundRequests(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      const access = await requireAdministrator(actor);
      if (!access.permissions.includes("finance")) throw new AppError("Acesso administrativo necessário.", 403, "FORBIDDEN");
      const requests = await withWorkflow((records) => records.filter((item) => item.kind === "order").flatMap((record) => {
        const order = orderFrom(record.data);
        if (!["pending", "partial", "failed"].includes(order.serviceDetails.refundStatus || "")) return [];
        const paidCents = quoteTotal(order.quote, order.serviceDetails.deliveryFeeCents, order.serviceDetails.discountCents);
        const alreadyRefundedCents = order.serviceDetails.refundAmountCents || 0;
        return [{ orderId: order.id, device: order.device, reason: order.serviceDetails.cancellationReason || "",
          requestedAt: order.serviceDetails.cancellationRequestedAt, paymentId: order.serviceDetails.paymentId,
          totalCents: Math.max(0, paidCents - alreadyRefundedCents), alreadyRefundedCents }];
      }).sort((a, b) => (a.requestedAt || "").localeCompare(b.requestedAt || "")));
      return ok({ requests });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async refund(request: NextRequest, id: string) {
    try {
      databaseId.parse(id);
      const actor = await actorFrom(request);
      const access = await requireAdministrator(actor);
      if (!access.permissions.includes("finance")) throw new AppError("Acesso administrativo necessário.", 403, "FORBIDDEN");
      const input = z.object({ amountCents: z.number().int().positive().optional(),
        reason: z.string().trim().min(10).max(1000) }).parse(await request.json());
      const prepared = await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === id);
        if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const order = orderFrom(record.data);
        if (order.serviceDetails.paymentStatus !== "confirmed" || !order.serviceDetails.paymentId)
          throw new AppError("Esta ordem não possui pagamento confirmado.", 409, "PAYMENT_NOT_REFUNDABLE");
        if (order.serviceDetails.refundStatus === "processed")
          return { order, alreadyProcessed: true as const, totalCents: 0 };
        const totalCents = quoteTotal(order.quote, order.serviceDetails.deliveryFeeCents, order.serviceDetails.discountCents);
        const alreadyRefundedCents = order.serviceDetails.refundAmountCents || 0;
        const remainingCents = totalCents - alreadyRefundedCents;
        if (remainingCents <= 0)
          return { order, alreadyProcessed: true as const, totalCents };
        if (input.amountCents && input.amountCents > remainingCents)
          throw new AppError("O reembolso não pode exceder o saldo ainda não reembolsado.", 422, "INVALID_REFUND_AMOUNT");
        order.serviceDetails.refundStatus = "pending";
        order.serviceDetails.cancellationReason = input.reason;
        record.data = { ...order };
        return { order, alreadyProcessed: false as const, totalCents, alreadyRefundedCents, remainingCents };
      }, true);
      if (prepared.alreadyProcessed) return ok({ refunded: true, order: prepared.order });
      const amount = input.amountCents ?? prepared.remainingCents;
      if (!prepared.order.serviceDetails.paymentPreferenceId)
        throw new AppError("A order do pagamento não foi encontrada.", 409, "PAYMENT_NOT_REFUNDABLE");
      const refund = await refundPayment({ paymentId: prepared.order.serviceDetails.paymentId!,
        orderId: prepared.order.serviceDetails.paymentPreferenceId, totalCents: prepared.totalCents,
        accessToken: await partnerAccessToken(prepared.order.partnerId), amountCents: amount });
      const providerProcessed = ["processed", "refunded", "approved"].includes(refund.status.toLowerCase());
      const order = await withWorkflow((records) => {
        const current = orderFrom(records.find((item) => item.kind === "order" && item.id === id)!.data);
        const cumulativeRefundCents = prepared.alreadyRefundedCents + (providerProcessed ? refund.amountCents : 0);
        current.serviceDetails.refundStatus = !providerProcessed ? "failed"
          : cumulativeRefundCents >= prepared.totalCents ? "processed" : "partial";
        current.serviceDetails.refundId = refund.id;
        current.serviceDetails.refundAmountCents = cumulativeRefundCents;
        if (providerProcessed) current.serviceDetails.refundedAt = new Date().toISOString();
        if (cumulativeRefundCents >= prepared.totalCents && !current.serviceDetails.logistics?.pickup?.deliveryId) {
          current.status = "cancelled";
          current.history.push({ status: "cancelled", at: current.serviceDetails.refundedAt! });
        }
        records.push({ id: nextWorkflowId(records), kind: "notification", ownerId: current.clientId,
          data: { message: providerProcessed
            ? `${current.device}: reembolso de ${(refund.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} processado.`
            : `${current.device}: o reembolso precisa de nova análise.`, href: "/cliente/ordens",
            read: false, createdAt: new Date().toISOString() } });
        return current;
      }, true);
      if (!providerProcessed)
        throw new AppError("O provedor não confirmou o reembolso.", 409, "REFUND_NOT_PROCESSED");
      return ok({ refunded: true, refund, order });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async checkout(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Apenas clientes podem pagar uma O.S.", 403, "FORBIDDEN");
      const input = z.object({ orderId: databaseId }).extend(checkoutInput.shape).parse(await request.json());
      const account = await accountById(actor.sub, "client");
      if (!account) throw new AppError("Cliente não encontrado.", 404, "NOT_FOUND");
      const prepared = await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === input.orderId);
        if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const order = orderFrom(record.data);
        const totalCents = prepareOrderPayment(order, actor.sub, input);
        // Preferences API identifiers/URLs stored by older releases cannot be
        // confirmed through Orders API. Discard only that legacy checkout and
        // preserve the frozen quote so the customer can safely try again.
        if (order.serviceDetails.paymentPreferenceId &&
          !order.serviceDetails.paymentPreferenceId.toUpperCase().startsWith("ORD")) {
          delete order.serviceDetails.paymentPreferenceId;
          delete order.serviceDetails.paymentCheckoutUrl;
        }
        record.data = { ...order };
        return { order, totalCents, existingCheckout: order.serviceDetails.paymentPreferenceId &&
          order.serviceDetails.paymentCheckoutUrl ? {
            id: order.serviceDetails.paymentPreferenceId,
            checkoutUrl: order.serviceDetails.paymentCheckoutUrl,
          } : null };
      }, true);
      const accessToken = await partnerAccessToken(prepared.order.partnerId);
      let previousProviderOrderId: string | undefined;
      if (prepared.existingCheckout) {
        const providerOrder = await getPaymentOrder(prepared.existingCheckout.id, accessToken);
        if (!["canceled", "failed"].includes(providerOrder.status)) return ok(prepared.existingCheckout);

        // Orders do Checkout Pro expiram (por padrão, após um dia). A URL
        // continua abrindo, mas o Mercado Pago desabilita o botão de pagar.
        // Remova somente o checkout que acabamos de validar como encerrado;
        // assim uma requisição concorrente nunca apaga uma Order mais nova.
        previousProviderOrderId = prepared.existingCheckout.id;
        delete prepared.order.serviceDetails.paymentPreferenceId;
        delete prepared.order.serviceDetails.paymentCheckoutUrl;
        await withWorkflow((records) => {
          const record = records.find((item) => item.kind === "order" && item.id === input.orderId);
          if (!record) return;
          const details = orderFrom(record.data).serviceDetails;
          if (details.paymentPreferenceId === previousProviderOrderId) {
            delete details.paymentPreferenceId;
            delete details.paymentCheckoutUrl;
          }
        }, true);
      }
      if (prepared.order.serviceDetails.paymentPreferenceId)
        throw new AppError("O checkout existente não pode ser recuperado. Contate o suporte.", 409, "CHECKOUT_ALREADY_STARTED");
      const preference = await createPreference({ orderId: input.orderId, title: `Reparo SmartFix — ${prepared.order.device}`,
        totalCents: prepared.totalCents, payerEmail: account.email,
        accessToken, previousProviderOrderId });
      await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === input.orderId);
        if (record) {
          const details = orderFrom(record.data).serviceDetails;
          details.paymentPreferenceId = preference.id;
          details.paymentCheckoutUrl = preference.checkoutUrl;
          details.marketplaceFeeCents = preference.marketplaceFeeCents;
          details.partnerGrossCents = prepared.totalCents - preference.marketplaceFeeCents;
        }
      }, true);
      return ok(preference);
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async confirm(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Acesso negado.", 403, "FORBIDDEN");
      const orderId = z.string().trim().min(10).max(100).parse(request.nextUrl.searchParams.get("orderId"));
      const confirmed = await confirmPayment(orderId, actor.sub);
      if (!confirmed)
        throw new AppError("O pagamento ainda não foi aprovado pelo provedor.", 409, "PAYMENT_NOT_APPROVED");
      return ok({ confirmed });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async webhook(request: NextRequest) {
    try {
      const body = z.object({ type: z.string().optional(), data: z.object({ id: z.union([z.string(), z.number()]) }) }).parse(await request.json());
      const dataId = request.nextUrl.searchParams.get("data.id") || "";
      const topic = request.nextUrl.searchParams.get("type") || body.type;
      if (!dataId || dataId !== String(body.data.id))
        throw new AppError("Notificação inválida.", 400, "INVALID_WEBHOOK");
      const signature = request.headers.get("x-signature") || "";
      const requestId = request.headers.get("x-request-id") || "";
      const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
      if (!secret || !parts.ts || !parts.v1 || !requestId) throw new AppError("Assinatura inválida.", 401, "INVALID_WEBHOOK");
      const expected = createHmac("sha256", secret).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`).digest("hex");
      const valid = expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
      if (!valid) throw new AppError("Assinatura inválida.", 401, "INVALID_WEBHOOK");
      if (topic === "order") await confirmPayment(dataId);
      return ok({ received: true });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
