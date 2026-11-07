import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/src/services/session.service";
import { isSessionRevoked } from "@/src/services/session-revocation.service";
import { accountById } from "@/src/services/account.service";
import { requireAdministrator } from "@/src/services/admin.service";
import AdminShell from "./AdminShell";

export default async function AdminLayout({children}:{children:ReactNode}){
  const token=(await cookies()).get(SESSION_COOKIE_NAME)?.value; const actor=token?verifySessionToken(token):null;
  if(!actor||await isSessionRevoked(actor)||!(await accountById(actor.sub,actor.role))) redirect("/login");
  let access;
  try { access=await requireAdministrator(actor); } catch { redirect("/login"); }
  return <AdminShell permissions={access.permissions}>{children}</AdminShell>;
}
