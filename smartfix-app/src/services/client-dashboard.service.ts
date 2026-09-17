import type { RepairOrder } from "@/src/types/workflow";

const activeStatuses = new Set(["pending", "quoted", "approved", "in_progress", "waiting_parts", "ready"]);
const attentionPriority: Record<string, number> = { quoted: 0, ready: 1, completed: 2 };

export function needsClientAttention(order: RepairOrder) {
  return order.status === "quoted" || order.status === "ready" ||
    (order.status === "completed" && !order.review);
}

export function summarizeClientOrders(orders: RepairOrder[]) {
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const attention = recent.filter(needsClientAttention).sort((a, b) =>
    attentionPriority[a.status] - attentionPriority[b.status] || b.createdAt.localeCompare(a.createdAt),
  );
  return {
    active: orders.filter((order) => activeStatuses.has(order.status)).length,
    awaitingApproval: orders.filter((order) => order.status === "quoted").length,
    completed: orders.filter((order) => order.status === "completed").length,
    attention: attention.slice(0, 3),
    attentionCount: attention.length,
    recent: recent.filter((order) => !needsClientAttention(order)).slice(0, 3),
  };
}
