import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/src/services/session.service";
import type { SessionRole } from "@/src/types/api";
import { isSessionRevoked } from "./session-revocation.service";
import { accountById } from "./account.service";

// Layouts and pages both enforce authorization. React.cache keeps those
// defense-in-depth checks while ensuring that a single render only reaches
// the session store and account table once for each role.
export const requirePageRole = cache(async (expectedRole: SessionRole) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const session = verifySessionToken(token);

  if (!session || await isSessionRevoked(session)) {
    redirect("/login");
  }

  if (!(await accountById(session.sub, session.role))) {
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
});
