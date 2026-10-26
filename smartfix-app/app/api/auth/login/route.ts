import { AuthController } from "@/src/controllers/AuthController";
import type { NextRequest } from "next/server";
import { withRateLimit } from "@/src/services/rate-limit.service";

export const runtime = "nodejs";
export function POST(request: NextRequest) {
  return withRateLimit(request, "auth:login", 10, 15 * 60_000, AuthController.login);
}
