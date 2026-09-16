import "server-only";
import type { Transaction } from "sequelize";
import { RepairOrderModel, Review } from "@/src/models";
import { AppError } from "@/src/errors/AppError";
import { quoteTotal } from "./order-policy.service";
import type { RepairOrder, WorkflowRecord } from "@/src/types/workflow";

export async function readRepairOrders(transaction: Transaction): Promise<WorkflowRecord[]> {
  const orders = await RepairOrderModel.findAll({ transaction });
  const reviews = await Review.findAll({ transaction });
  const reviewsByOrder = new Map(reviews.map((review) => [review.repair_order_id, review]));
  return orders.map((row) => {
    const review = reviewsByOrder.get(row.id);
    const order: RepairOrder = {
      id: row.id, clientId: row.client_id, partnerId: row.partner_id, deviceId: row.device_id,
      problem: row.problem_description, status: row.status, device: row.device_label,
      symptoms: row.symptoms, checklist: row.checklist, quote: row.quote,
      diagnosis: row.diagnosis, history: row.history, createdAt: row.created_at.toISOString(),
      review: review ? { rating: review.rating, comment: review.comment } : null,
    };
    return { id: row.id, kind: "order", ownerId: row.client_id, data: { ...order } };
  });
}

export async function saveRepairOrder(order: RepairOrder, transaction: Transaction) {
  const totalCents = quoteTotal(order.quote);
  const budget = order.quote.length
    ? `${Math.floor(totalCents / 100)}.${String(totalCents % 100).padStart(2, "0")}`
    : null;
  await RepairOrderModel.upsert({
    id: order.id, client_id: order.clientId, partner_id: order.partnerId, device_id: order.deviceId,
    problem_description: order.problem, status: order.status,
    request_date: order.createdAt.slice(0, 10), created_at: new Date(order.createdAt),
    estimated_budget: budget, device_label: order.device, symptoms: order.symptoms,
    checklist: order.checklist, quote: order.quote, diagnosis: order.diagnosis, history: order.history,
  }, { transaction });
  if (order.review) {
    const existing = await Review.findOne({ where: { repair_order_id: order.id }, transaction });
    if (existing) {
      if (existing.rating !== order.review.rating || existing.comment !== order.review.comment)
        throw new AppError("Esta ordem já foi avaliada.", 409, "ALREADY_REVIEWED");
    } else {
      await Review.create({ repair_order_id: order.id, client_id: order.clientId,
        partner_id: order.partnerId, rating: order.review.rating, comment: order.review.comment,
        review_date: new Date().toISOString().slice(0, 10) }, { transaction });
    }
  }
}
