import { NextRequest } from "next/server";
import { AppError } from "@/src/errors/AppError";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/src/services/session.service";

export function requireSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new AppError("Sessão não encontrada.", 401, "UNAUTHENTICATED");
  }

  const session = verifySessionToken(token);

  if (!session) {
    throw new AppError("Sessão inválida ou expirada.", 401, "UNAUTHENTICATED");
  }

  return session;
}
