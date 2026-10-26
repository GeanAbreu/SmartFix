import type { NextRequest } from "next/server";
import { LogisticsController } from "@/src/controllers/LogisticsController";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  return LogisticsController.dispatch(request, (await context.params).id);
}
