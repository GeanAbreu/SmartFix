import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SupportInbox from "@/app/components/SupportInbox";
import { accountById, isAdministrator } from "@/src/services/account.service";
import { isSessionRevoked } from "@/src/services/session-revocation.service";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/src/services/session.service";
export const dynamic = "force-dynamic";
export default async function Page() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const actor = token ? verifySessionToken(token) : null;
  if (!actor || await isSessionRevoked(actor) || !isAdministrator(actor.sub) || !(await accountById(actor.sub, actor.role))) redirect("/login");
  return <SupportInbox mode="admin" />;
}
