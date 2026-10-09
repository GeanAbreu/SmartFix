import type { RepairOrder } from "@/src/types/workflow";

export type DashboardNotification = {
  id: string;
  data: { message: string; href: string; read: boolean; createdAt: string };
};

export function summarizePartnerFinance(orders: RepairOrder[]) {
  const quotedOrders = orders.filter((order) => !["pending", "cancelled", "rejected"].includes(order.status));
  const confirmedOrders = quotedOrders.filter((order) => order.serviceDetails.paymentStatus === "confirmed");
  const pendingOrders = quotedOrders.filter((order) => order.serviceDetails.paymentStatus !== "confirmed");
  const totalFor = (order: RepairOrder) => order.quote.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    order.serviceDetails.deliveryFeeCents - order.serviceDetails.discountCents,
  );
  const receivedCents = confirmedOrders.reduce((sum, order) => sum + totalFor(order), 0);
  const pendingCents = pendingOrders.reduce((sum, order) => sum + totalFor(order), 0);
  return {
    receivedCents,
    pendingCents,
    grossCents: receivedCents + pendingCents,
    paidOrders: confirmedOrders.length,
    pendingOrders: pendingOrders.length,
    averageTicketCents: confirmedOrders.length ? Math.round(receivedCents / confirmedOrders.length) : 0,
  };
}

export function summarizePartnerWork(orders: RepairOrder[], notifications: DashboardNotification[]) {
  const pending = orders.filter((order) => order.status === "pending");
  const active = orders.filter((order) =>
    ["approved", "in_progress", "waiting_parts", "ready"].includes(order.status),
  );
  const completed = orders.filter((order) => order.status === "completed");
  const decided = orders.filter((order) => !["pending", "cancelled"].includes(order.status));
  const won = decided.filter((order) => !["quoted", "cancelled", "rejected"].includes(order.status));
  const quoteResponseHours = orders.flatMap((order) => {
    const received = order.history.find((item) => item.status === "pending");
    const quoted = order.history.find((item) => item.status === "quoted");
    return received && quoted ? [(new Date(quoted.at).getTime() - new Date(received.at).getTime()) / 3_600_000] : [];
  }).filter((hours) => hours >= 0);
  const attention = orders.filter((order) => ["pending", "waiting_parts", "ready"].includes(order.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    total: orders.length,
    pending: pending.length,
    awaitingApproval: orders.filter((order) => order.status === "quoted").length,
    active: active.length,
    unread: notifications.filter((notification) => !notification.data.read).length,
    completed: completed.length,
    conversionRate: decided.length ? Math.round((won.length / decided.length) * 100) : 0,
    averageResponseHours: quoteResponseHours.length ? Math.round(quoteResponseHours.reduce((sum, value) => sum + value, 0) / quoteResponseHours.length) : null,
    attention,
    requests: [...pending, ...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
