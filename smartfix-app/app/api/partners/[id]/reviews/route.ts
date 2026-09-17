import { NextRequest } from "next/server";
import { DiscoveryController } from "@/src/controllers/DiscoveryController";
export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return DiscoveryController.reviews(request, (await context.params).id);
}
