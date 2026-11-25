import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/src/errors/AppError";
import { databaseId } from "@/src/validations/database-id";
import { actorFrom, accountById } from "@/src/services/account.service";
import { checkInfinitePayPayment, createInfinitePayCheckout, platformInfinitePayCredentials } from "@/src/services/infinitepay.service";
import { checkoutInput, confirmOrderPayment, prepareOrderPayment, quoteTotal } from "@/src/services/order-policy.service";
import { nextWorkflowId, withWorkflow } from "@/src/services/workflow.service";
import type { RepairOrder } from "@/src/types/workflow";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function ok(data: unknown) { return noStoreResponse(NextResponse.json({ success: true, data })); }
function orderFrom(data: Record<string, unknown>) { return data as unknown as RepairOrder; }
const confirmationInput = z.object({
  order_nsu: databaseId,
  transaction_nsu: z.string().trim().min(3).max(200),
  invoice_slug: z.string().trim().min(1).max(200),
  receipt_url: z.url().optional(),
});

async function verifyAndConfirm(input: z.infer<typeof confirmationInput>, expectedClientId?: string) {
  await withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" && item.id === input.order_nsu);
    if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const order = orderFrom(record.data);
    if (expectedClientId && order.clientId !== expectedClientId) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    if (order.serviceDetails.paymentProvider !== "infinitepay")
      throw new AppError("O pagamento não pertence à InfinitePay.", 409, "PAYMENT_ORDER_MISMATCH");
  });
  const credentials = platformInfinitePayCredentials();
  const payment = await checkInfinitePayPayment({ orderId: input.order_nsu, transactionNsu: input.transaction_nsu,
    slug: input.invoice_slug, credentials });
  if (!payment.success || !payment.paid) return false;
  const confirmation = await withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" && item.id === input.order_nsu);
    if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const order = orderFrom(record.data);
    if (expectedClientId && order.clientId !== expectedClientId) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const total = quoteTotal(order.quote, order.serviceDetails.deliveryFeeCents, order.serviceDetails.discountCents);
    if (payment.amount !== total) throw new AppError("O valor confirmado pelo provedor é inválido.", 409, "PAYMENT_AMOUNT_MISMATCH");
    const changed = confirmOrderPayment(order, input.transaction_nsu,
      payment.capture_method === "credit_card" ? "card" : "pix", "infinitepay");
    order.serviceDetails.paymentReceiptUrl = input.receipt_url;
    order.serviceDetails.marketplaceFeeCents = 0;
    order.serviceDetails.partnerGrossCents = total;
    record.data = { ...order };
    if (changed) records.push({ id: nextWorkflowId(records), kind: "notification", ownerId: order.partnerId,
      data: { message: `${order.device}: pagamento confirmado. Aguarde a entrega do aparelho pelo cliente.`,
        href: "/parceiro/ordens", read: false, createdAt: new Date().toISOString() } });
    return { changed, confirmed: order.serviceDetails.paymentStatus === "confirmed" };
  }, true);
  return confirmation.confirmed;
}

export class InfinitePayController {
  static async providers(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Acesso negado.", 403, "FORBIDDEN");
      const orderId = databaseId.parse(request.nextUrl.searchParams.get("orderId"));
      await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === orderId);
        if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const value = orderFrom(record.data);
        if (value.clientId !== actor.sub) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        return value;
      });
      return ok({ infinitePay: Boolean(process.env.INFINITEPAY_API_KEY?.trim() && process.env.INFINITEPAY_HANDLE?.trim()) });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async checkout(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Apenas clientes podem pagar uma O.S.", 403, "FORBIDDEN");
      const input = z.object({ orderId: databaseId }).extend(checkoutInput.shape).parse(await request.json());
      if (input.payment !== "infinitepay") throw new AppError("Provedor de pagamento inválido.", 422, "INVALID_PAYMENT_PROVIDER");
      const account = await accountById(actor.sub, "client");
      if (!account) throw new AppError("Cliente não encontrado.", 404, "NOT_FOUND");
      const prepared = await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === input.orderId);
        if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const order = orderFrom(record.data);
        const previousProvider = order.serviceDetails.paymentProvider;
        const totalCents = prepareOrderPayment(order, actor.sub, input);
        if (previousProvider !== "infinitepay") {
          delete order.serviceDetails.paymentPreferenceId;
          delete order.serviceDetails.paymentCheckoutUrl;
        }
        record.data = { ...order };
        return { order, totalCents, existingCheckout: order.serviceDetails.paymentCheckoutUrl };
      }, true);
      if (prepared.existingCheckout) return ok({ id: prepared.order.serviceDetails.paymentPreferenceId || input.orderId,
        checkoutUrl: prepared.existingCheckout });
      const credentials = platformInfinitePayCredentials();
      const checkout = await createInfinitePayCheckout({ orderId: input.orderId,
        title: `Reparo SmartFix — ${prepared.order.device}`, totalCents: prepared.totalCents,
        customer: { name: account.name || "Cliente SmartFix", email: account.email, phone: account.phone }, credentials });
      await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === input.orderId);
        if (record) {
          const details = orderFrom(record.data).serviceDetails;
          details.paymentPreferenceId = checkout.id;
          details.paymentCheckoutUrl = checkout.checkoutUrl;
          details.marketplaceFeeCents = 0;
          details.partnerGrossCents = prepared.totalCents;
        }
      }, true);
      return ok(checkout);
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async confirm(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Acesso negado.", 403, "FORBIDDEN");
      const input = confirmationInput.parse({
        order_nsu: request.nextUrl.searchParams.get("order_nsu") || request.nextUrl.searchParams.get("order"),
        transaction_nsu: request.nextUrl.searchParams.get("transaction_nsu"),
        invoice_slug: request.nextUrl.searchParams.get("slug"),
        receipt_url: request.nextUrl.searchParams.get("receipt_url") || undefined,
      });
      if (!(await verifyAndConfirm(input, actor.sub)))
        throw new AppError("O pagamento ainda não foi aprovado pelo provedor.", 409, "PAYMENT_NOT_APPROVED");
      return ok({ confirmed: true });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async webhook(request: NextRequest) {
    try {
      const body = z.object({
        invoice_slug: z.string().trim().min(1).max(200), amount: z.number().int().positive(),
        transaction_nsu: z.string().trim().min(3).max(200), order_nsu: databaseId,
        receipt_url: z.url().optional(),
      }).parse(await request.json());
      await verifyAndConfirm(body);
      return ok({ received: true });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
