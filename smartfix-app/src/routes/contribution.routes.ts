import type { NextRequest } from "next/server";
import { WorkflowController } from "@/src/controllers/WorkflowController";
import { RecoveryController } from "@/src/controllers/RecoveryController";
import { GoogleController } from "@/src/controllers/GoogleController";
type Context = { params: Promise<{ id: string }> };
export const contributionRoutes = {
  listOrders: (request: NextRequest) => WorkflowController.list(request),
  createOrder: (request: NextRequest) => WorkflowController.create(request),
  updateOrder: async (request: NextRequest, context: Context) =>
    WorkflowController.update(request, (await context.params).id),
  listPartners: (request: NextRequest) => WorkflowController.partners(request),
  approvePartner: async (request: NextRequest, context: Context) =>
    WorkflowController.approvePartner(request, (await context.params).id),
  listNotifications: (request: NextRequest) =>
    WorkflowController.notifications(request),
  readNotification: async (request: NextRequest, context: Context) =>
    WorkflowController.readNotification(request, (await context.params).id),
  listServices: (request: NextRequest) => WorkflowController.services(request),
  createService: (request: NextRequest) => WorkflowController.services(request),
  requestPasswordReset: (request: NextRequest) =>
    RecoveryController.request(request),
  resetPassword: (request: NextRequest) => RecoveryController.reset(request),
  startGoogleLogin: (request: NextRequest) => GoogleController.start(request),
  googleCallback: (request: NextRequest) => GoogleController.callback(request),
};
