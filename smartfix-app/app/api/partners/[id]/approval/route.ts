import type { NextRequest } from "next/server";
import { WorkflowController } from "@/src/controllers/WorkflowController";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  return WorkflowController.approvePartner(request, (await context.params).id);
}
