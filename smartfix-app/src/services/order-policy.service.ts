import { z } from "zod";
import { AppError } from "@/src/errors/AppError";
import {
  CHECKLIST,
  SYMPTOMS,
  type OrderStatus,
  type QuoteItem,
  type RepairOrder,
} from "@/src/types/workflow";

export const orderInput = z.object({
  deviceId: z.uuid(),
  partnerId: z.uuid(),
  problem: z.string().trim().min(10).max(3000),
  symptoms: z
    .array(z.enum(SYMPTOMS as [string, ...string[]]))
    .max(SYMPTOMS.length)
    .default([]),
  checklist: z
    .array(z.enum(CHECKLIST as [string, ...string[]]))
    .max(CHECKLIST.length)
    .default([]),
});
export const quoteItemInput = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.enum(["part", "labor"]).default("labor"),
  details: z.string().trim().max(500).default(""),
  quantity: z.number().int().min(1).max(100),
  unitPriceCents: z.number().int().min(0).max(10_000_000),
});
export const orderAction = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("quote"),
    diagnosis: z.string().trim().min(3).max(3000),
    estimatedDays: z.number().int().min(1).max(365),
    warrantyDays: z.number().int().min(0).max(3650),
    deliveryFeeCents: z.number().int().min(0).max(10_000_000).default(0),
    items: z.array(quoteItemInput).min(1).max(30),
  }),
  z.object({
    action: z.literal("approve"),
    scheduledDate: z.iso.date(),
    schedulePeriod: z.enum(["morning", "afternoon"]),
    serviceAddress: z.string().trim().min(8).max(500),
    paymentMethod: z.enum(["pix", "card"]),
    couponCode: z.string().trim().max(30).default(""),
  }),
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("status"),
    status: z.enum(["in_progress", "waiting_parts", "ready", "completed"]),
  }),
  z.object({
    action: z.literal("review"),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).default(""),
  }),
]);
export function quoteTotal(items: QuoteItem[], deliveryFeeCents = 0, discountCents = 0) {
  return items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    deliveryFeeCents,
  ) - discountCents;
}
export function applyOrderAction(
  order: RepairOrder,
  actor: { sub: string; role: string },
  input: z.infer<typeof orderAction>,
) {
  const client = actor.role === "client" && actor.sub === order.clientId;
  const partner = actor.role === "partner" && actor.sub === order.partnerId;
  if (!client && !partner)
    throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
  let status: OrderStatus = order.status;
  const invalid = () => {
    throw new AppError(
      "Ação não permitida nesta etapa da ordem.",
      409,
      "INVALID_TRANSITION",
    );
  };
  if (input.action === "quote") {
    if (!partner || !["pending", "quoted"].includes(status)) invalid();
    order.quote = input.items;
    order.diagnosis = input.diagnosis;
    order.serviceDetails.estimatedDays = input.estimatedDays;
    order.serviceDetails.warrantyDays = input.warrantyDays;
    order.serviceDetails.deliveryFeeCents = input.deliveryFeeCents;
    status = "quoted";
  } else if (input.action === "approve") {
    if (!client || status !== "quoted") invalid();
    const scheduled = new Date(`${input.scheduledDate}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(scheduled.getTime()) || scheduled < today)
      throw new AppError("Escolha uma data de agendamento válida.", 422, "INVALID_SCHEDULE");
    order.serviceDetails.scheduledDate = input.scheduledDate;
    order.serviceDetails.schedulePeriod = input.schedulePeriod;
    order.serviceDetails.serviceAddress = input.serviceAddress;
    order.serviceDetails.paymentMethod = input.paymentMethod;
    order.serviceDetails.couponCode = input.couponCode.toUpperCase();
    order.serviceDetails.discountCents = order.serviceDetails.couponCode === "SMART10"
      ? Math.round(quoteTotal(order.quote) * 0.1) : 0;
    order.serviceDetails.paymentStatus = "confirmed";
    order.serviceDetails.paidAt = new Date().toISOString();
    status = "approved";
  } else if (input.action === "cancel") {
    if (!client || !["pending", "quoted"].includes(status)) invalid();
    status = "cancelled";
  } else if (input.action === "review") {
    if (!client || status !== "completed" || order.review) invalid();
    order.review = { rating: input.rating, comment: input.comment };
  } else {
    const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
      approved: ["in_progress"],
      in_progress: ["waiting_parts", "ready"],
      waiting_parts: ["in_progress"],
      ready: ["completed"],
    };
    if (!partner || !allowed[status]?.includes(input.status)) invalid();
    status = input.status;
  }
  if (order.status !== status)
    order.history.push({ status, at: new Date().toISOString() });
  order.status = status;
  return order;
}
