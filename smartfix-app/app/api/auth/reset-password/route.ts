import { RecoveryController } from "@/src/controllers/RecoveryController";
import type { NextRequest } from "next/server";
import { withRateLimit } from "@/src/services/rate-limit.service";
export const runtime = "nodejs";
export function POST(request: NextRequest) {
  return withRateLimit(request, "auth:reset", 10, 15 * 60_000, RecoveryController.reset);
}
