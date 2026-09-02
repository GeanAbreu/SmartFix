import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/src/services/session.service";
import type { SessionRole } from "@/src/types/api";

export async function requirePageRole(expectedRole: SessionRole) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const session = verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  if (session.role !== expectedRole) {
    redirect(
      session.role === "client"
        ? "/cliente/dashboard"
        : "/parceiro/dashboard"
    );
  }

  return session;
}

