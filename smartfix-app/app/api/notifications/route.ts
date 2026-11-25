import { WorkflowController } from "@/src/controllers/WorkflowController";
export const runtime = "nodejs";
export const GET = WorkflowController.notifications;
export const DELETE = WorkflowController.clearNotifications;
