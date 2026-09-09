import { requirePageRole } from "@/src/services/page-authorization.service";
import AccountWorkspace from "@/app/components/AccountWorkspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageRole("client");
  return <AccountWorkspace mode="profile" root="/cliente" />;
}
