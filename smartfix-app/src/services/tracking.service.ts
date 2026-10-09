import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { AppError } from "@/src/errors/AppError";
import { signServerValue } from "@/src/services/session.service";
import { withWorkflow } from "@/src/services/workflow.service";
import { ORDER_LABELS, type RepairOrder, type WorkflowRecord } from "@/src/types/workflow";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function realtimeConfiguration(hash: string) {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  return { url, publishableKey, topic: `tracking:${hash}` };
}

function tokenFor(orderId: string, nonce: string) {
  return signServerValue("public-order-tracking", `${orderId}:${nonce}`);
}

function asOrder(record: WorkflowRecord) {
  return record.data as unknown as RepairOrder;
}

export async function issueTrackingToken(orderId: string, actorId: string) {
  return withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" && item.id === orderId);
    if (!record || asOrder(record).clientId !== actorId)
      throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");

    const order = asOrder(record);
    order.trackingTokenNonce ||= randomBytes(32).toString("base64url");
    const token = tokenFor(order.id, order.trackingTokenNonce);
    order.trackingTokenHash = tokenHash(token);
    record.data = { ...order };
    return token;
  }, true);
}

export async function revokeTrackingToken(orderId: string, actorId: string) {
  return withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" && item.id === orderId);
    if (!record || asOrder(record).clientId !== actorId)
      throw new AppError("Ordem não encontrada.", 404, "NOT_FOUND");
    const order = asOrder(record);
    delete order.trackingTokenNonce;
    delete order.trackingTokenHash;
    record.data = { ...order };
  }, true);
}

export async function findPublicTracking(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;
  const hash = tokenHash(token);
  return withWorkflow((records) => {
    const record = records.find((item) => item.kind === "order" && asOrder(item).trackingTokenHash === hash);
    if (!record) return null;
    const order = asOrder(record);
    if (!order.trackingTokenNonce || tokenFor(order.id, order.trackingTokenNonce) !== token) return null;
    return {
      code: order.id.slice(0, 8).toUpperCase(),
      device: order.device,
      status: order.status,
      statusLabel: ORDER_LABELS[order.status],
      createdAt: order.createdAt,
      history: order.history.map((item) => ({ ...item, label: ORDER_LABELS[item.status] })),
      realtime: realtimeConfiguration(hash),
    };
  });
}
