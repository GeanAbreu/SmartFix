import { ServiceController } from "@/src/controllers/ServiceController";
export const runtime = "nodejs";
export const PATCH = async (request: import("next/server").NextRequest, context: { params: Promise<{ id: string }> }) =>
  ServiceController.update(request, (await context.params).id);
