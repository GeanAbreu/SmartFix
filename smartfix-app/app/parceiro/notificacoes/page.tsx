import { requirePageRole } from "@/src/services/page-authorization.service";
import AccountWorkspace from "@/app/components/AccountWorkspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageRole("partner");
  return <AccountWorkspace mode="notifications" root="/parceiro" />;
}
