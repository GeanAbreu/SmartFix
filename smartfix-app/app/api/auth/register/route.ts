import { AuthController } from "@/src/controllers/AuthController";
import type { NextRequest } from "next/server";
import { withRateLimit } from "@/src/services/rate-limit.service";

export const runtime = "nodejs";
export function POST(request: NextRequest) {
  return withRateLimit(request, "auth:register", 5, 60 * 60_000, AuthController.register);
}
