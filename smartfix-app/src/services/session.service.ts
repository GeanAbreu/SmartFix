import { createHmac, timingSafeEqual } from "node:crypto";
import { getAuthSecret } from "@/src/services/auth-secret.service";
import type { SessionRole } from "@/src/types/api";

export const SESSION_COOKIE_NAME = "smartfix_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  role: SessionRole;
  exp: number;
  iat?: number;
};

function sign(encodedPayload: string) {
  return createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function signServerValue(namespace: string, value: string) {
  return createHmac("sha256", getAuthSecret())
    .update(`${namespace}:${value}`)
    .digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionPayload, "exp" | "iat">
) {
  const completePayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    iat: Date.now(),
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(completePayload),
    "utf8"
  ).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const tokenParts = token.split(".");

  if (tokenParts.length !== 2) {
    return null;
  }

  const [encodedPayload, receivedSignature] = tokenParts;

  if (!encodedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );

    const candidate = payload as {
      sub?: unknown;
      role?: unknown;
      exp?: unknown;
      iat?: unknown;
    };

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof candidate.sub !== "string" ||
      candidate.sub.length === 0 ||
      (candidate.role !== "client" && candidate.role !== "partner") ||
      typeof candidate.exp !== "number" ||
      (candidate.iat !== undefined && (typeof candidate.iat !== "number" || !Number.isFinite(candidate.iat) || candidate.iat > Date.now() + 5000)) ||
      candidate.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      sub: candidate.sub,
      role: candidate.role,
      exp: candidate.exp,
      ...(typeof candidate.iat === "number" ? { iat: candidate.iat } : {}),
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
  priority: "high" as const,
};
