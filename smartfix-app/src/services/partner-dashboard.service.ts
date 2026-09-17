import type { RepairOrder } from "@/src/types/workflow";

export type DashboardNotification = {
  id: string;
  data: { message: string; href: string; read: boolean; createdAt: string };
};

export function summarizePartnerWork(orders: RepairOrder[], notifications: DashboardNotification[]) {
  const pending = orders.filter((order) => order.status === "pending");
  const active = orders.filter((order) =>
    ["approved", "in_progress", "waiting_parts", "ready"].includes(order.status),
  );
  return {
    total: orders.length,
    pending: pending.length,
    awaitingApproval: orders.filter((order) => order.status === "quoted").length,
    active: active.length,
    unread: notifications.filter((notification) => !notification.data.read).length,
    requests: [...pending, ...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
