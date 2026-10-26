import { RecoveryController } from "@/src/controllers/RecoveryController";
import type { NextRequest } from "next/server";
import { withRateLimit } from "@/src/services/rate-limit.service";
export const runtime = "nodejs";
export function POST(request: NextRequest) {
  return withRateLimit(request, "auth:forgot", 5, 30 * 60_000, RecoveryController.request);
}
