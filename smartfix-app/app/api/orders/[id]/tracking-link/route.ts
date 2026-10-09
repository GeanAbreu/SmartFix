import type { NextRequest } from "next/server";
import { TrackingController } from "@/src/controllers/TrackingController";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  return TrackingController.issue(request, (await context.params).id);
}

export async function DELETE(request: NextRequest, context: Context) {
  return TrackingController.revoke(request, (await context.params).id);
}
