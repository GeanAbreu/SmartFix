import { requirePageRole } from "@/src/services/page-authorization.service";
import PartnerNotifications from "./PartnerNotifications";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageRole("partner");
  return <PartnerNotifications />;
}
