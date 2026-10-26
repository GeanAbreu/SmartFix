import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { noStoreResponse } from "@/src/controllers/controller.utils";

type Bucket = { count: number; resetAt: number };
const globalState = globalThis as unknown as { smartfixRateLimits?: Map<string, Bucket> };
const buckets = globalState.smartfixRateLimits ??= new Map<string, Bucket>();

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${address}:${request.headers.get("user-agent") || ""}`).digest("hex");
}

export async function withRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
  handler: (request: NextRequest) => Promise<Response>,
) {
  const now = Date.now();
  if (buckets.size > 10_000)
    for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
  const key = `${scope}:${clientKey(request)}`;
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return noStoreResponse(NextResponse.json({ success: false,
      message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }));
  }
  return handler(request);
}
