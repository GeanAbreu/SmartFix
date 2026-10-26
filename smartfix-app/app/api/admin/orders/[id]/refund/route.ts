import type { NextRequest } from "next/server";
import { PaymentController } from "@/src/controllers/PaymentController";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: Context) {
  return PaymentController.refund(request, (await context.params).id);
}
