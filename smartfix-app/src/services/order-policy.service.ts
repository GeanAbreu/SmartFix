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
  quantity: z.number().int().min(1).max(100),
  unitPriceCents: z.number().int().min(0).max(10_000_000),
});
export const orderAction = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("quote"),
    diagnosis: z.string().trim().min(3).max(3000),
    items: z.array(quoteItemInput).min(1).max(30),
  }),
  z.object({ action: z.literal("approve") }),
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
export function quoteTotal(items: QuoteItem[]) {
  return items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );
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
    status = "quoted";
  } else if (input.action === "approve") {
    if (!client || status !== "quoted") invalid();
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
