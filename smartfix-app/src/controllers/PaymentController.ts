import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/src/errors/AppError";
import { actorFrom } from "@/src/services/account.service";
import { requireAdministrator } from "@/src/services/admin.service";
import { quoteTotal } from "@/src/services/order-policy.service";
import { nextWorkflowId, withWorkflow } from "@/src/services/workflow.service";
import { databaseId } from "@/src/validations/database-id";
import type { RepairOrder } from "@/src/types/workflow";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

const ok = (data: unknown) => noStoreResponse(NextResponse.json({ success: true, data }));
const orderFrom = (data: Record<string, unknown>) => data as unknown as RepairOrder;

export class PaymentController {
  static async refundRequests(request: NextRequest) {
    try {
      const access = await requireAdministrator(await actorFrom(request));
      if (!access.permissions.includes("finance")) throw new AppError("Acesso administrativo necessário.", 403, "FORBIDDEN");
      const requests = await withWorkflow((records) => records.filter((item) => item.kind === "order").flatMap((record) => {
        const order = orderFrom(record.data); if (!["pending", "partial", "failed"].includes(order.serviceDetails.refundStatus || "")) return [];
        const total = quoteTotal(order.quote, 0, order.serviceDetails.discountCents);
        return [{ orderId: order.id, device: order.device, reason: order.serviceDetails.cancellationReason || "", requestedAt: order.serviceDetails.cancellationRequestedAt, paymentId: order.serviceDetails.paymentId, totalCents: Math.max(0, total - (order.serviceDetails.refundAmountCents || 0)), alreadyRefundedCents: order.serviceDetails.refundAmountCents || 0 }];
      }));
      return ok({ requests });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async refund(request: NextRequest, id: string) {
    try {
      databaseId.parse(id); const actor = await actorFrom(request); const access = await requireAdministrator(actor);
      if (!access.permissions.includes("finance")) throw new AppError("Acesso administrativo necessário.", 403, "FORBIDDEN");
      const input = z.object({ amountCents: z.number().int().positive().optional(), reason: z.string().trim().min(10).max(1000), reference: z.string().trim().min(3).max(200).default("SMARTFIX-MANUAL") }).parse(await request.json());
      const order = await withWorkflow((records) => {
        const record = records.find((item) => item.kind === "order" && item.id === id); if (!record) throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
        const current = orderFrom(record.data); if (current.serviceDetails.paymentStatus !== "confirmed") throw new AppError("Esta ordem não possui pagamento confirmado.", 409, "PAYMENT_NOT_REFUNDABLE");
        const total = quoteTotal(current.quote, 0, current.serviceDetails.discountCents); const amount = input.amountCents ?? total;
        if (amount > total) throw new AppError("O reembolso não pode exceder o valor pago.", 422, "INVALID_REFUND_AMOUNT");
        current.serviceDetails.refundStatus = amount === total ? "processed" : "partial"; current.serviceDetails.refundAmountCents = amount; current.serviceDetails.refundId = input.reference; current.serviceDetails.refundedAt = new Date().toISOString(); current.serviceDetails.cancellationReason = input.reason;
        if (amount === total) { current.status = "cancelled"; current.history.push({ status: "cancelled", at: current.serviceDetails.refundedAt }); }
        records.push({ id: nextWorkflowId(records), kind: "notification", ownerId: current.clientId, data: { message: `${current.device}: reembolso de ${(amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} registrado pela SmartFix.`, href: "/cliente/ordens", read: false, createdAt: current.serviceDetails.refundedAt } });
        record.data = { ...current }; return current;
      }, true);
      return ok({ refunded: true, order });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
