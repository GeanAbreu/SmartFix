import { requirePageRole } from "@/src/services/page-authorization.service";
import RepairWorkspace from "@/app/components/RepairWorkspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageRole("partner");
  return <RepairWorkspace role="partner" />;
}
