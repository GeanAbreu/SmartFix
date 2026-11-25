import "server-only";
import { nextWorkflowId, withWorkflow } from "./workflow.service";
import type { RepairOrder } from "@/src/types/workflow";

export async function cancelExpiredUnpaidOrders(now = new Date()) {
  return withWorkflow((records) => {
    let cancelled = 0;
    for (const record of records) {
      if (record.kind !== "order") continue;
      const order = record.data as unknown as RepairOrder;
      if (order.status !== "quoted" || order.serviceDetails.paymentStatus === "confirmed") continue;
      const deadline = order.serviceDetails.paymentExpiresAt
        ? Date.parse(order.serviceDetails.paymentExpiresAt)
        : Date.parse(order.createdAt) + 24 * 60 * 60_000;
      if (!Number.isFinite(deadline) || deadline > now.getTime()) continue;
      order.status = "cancelled";
      order.serviceDetails.auditTrail ??= [];
      order.serviceDetails.auditTrail.push({ at: now.toISOString(), actorId: "system", actorRole: "system", action: "payment_expired", fromStatus: "quoted", toStatus: "cancelled" });
      order.history.push({ status: "cancelled", at: now.toISOString() });
      record.data = { ...order };
      for (const ownerId of [order.clientId, order.partnerId]) records.push({ id: nextWorkflowId(records), kind: "notification", ownerId, data: { message: `${order.device}: OS cancelada automaticamente por falta de pagamento em 24 horas.`, href: ownerId === order.clientId ? "/cliente/ordens" : "/parceiro/ordens", read: false, createdAt: now.toISOString() } });
      cancelled += 1;
    }
    return cancelled;
  }, true);
}
