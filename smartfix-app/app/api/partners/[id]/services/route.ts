import { ServiceController } from "@/src/controllers/ServiceController";
export const runtime = "nodejs";
export const GET = async (request: import("next/server").NextRequest, context: { params: Promise<{ id: string }> }) =>
  ServiceController.publicList(request, (await context.params).id);
