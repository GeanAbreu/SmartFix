import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from "@/src/errors/AppError";
import type { SessionRole } from "@/src/types/api";

export const SESSION_COOKIE_NAME = "smartfix_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  role: SessionRole;
  exp: number;
};

const globalForSession = globalThis as unknown as {
  smartfixDevelopmentSessionSecret?: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === "development") {
    globalForSession.smartfixDevelopmentSessionSecret ??=
      randomBytes(48).toString("hex");
    return globalForSession.smartfixDevelopmentSessionSecret;
  }

  if (!secret || secret.length < 32) {
    throw new AppError(
      "O serviço de autenticação não está configurado neste ambiente.",
      503,
      "SESSION_NOT_CONFIGURED"
    );
  }

  return secret;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionPayload, "exp">
) {
  const completePayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
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
    };

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof candidate.sub !== "string" ||
      candidate.sub.length === 0 ||
      (candidate.role !== "client" && candidate.role !== "partner") ||
      typeof candidate.exp !== "number" ||
      candidate.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      sub: candidate.sub,
      role: candidate.role,
      exp: candidate.exp,
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
