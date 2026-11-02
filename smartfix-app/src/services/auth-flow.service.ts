import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getAuthSecret } from "@/src/services/auth-secret.service";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function secret() {
  return getAuthSecret();
}
export function sealFlow(data: Record<string, unknown>) {
  const payload = Buffer.from(
    JSON.stringify({ ...data, expires: Date.now() + 600_000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(`oauth:${payload}`).digest("base64url")}`;
}
export function openFlow(value: string): Record<string, unknown> | null {
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", secret())
    .update(`oauth:${payload}`)
    .digest("base64url");
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  )
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.expires === "number" && data.expires > Date.now()
      ? data
      : null;
  } catch {
    return null;
  }
}
